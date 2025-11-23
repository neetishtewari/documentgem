from fastapi import APIRouter, HTTPException, Body
from fastapi.concurrency import run_in_threadpool
from app.core.config import settings
from supabase import create_client, Client
from app.services.ai_service import generate_embedding
from openai import AsyncOpenAI

router = APIRouter()
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

@router.post("/{document_id}")
async def chat_with_document(document_id: str, query: str = Body(..., embed=True)):
    try:
        # 1. Generate embedding for the query (Async)
        query_embedding = await generate_embedding(query)
        if not query_embedding:
            raise HTTPException(status_code=500, detail="Failed to generate embedding for query")

        # 2. Search for relevant document chunks (Blocking DB call -> Thread Pool)
        def search_db():
            return supabase.rpc("match_documents", {
                "query_embedding": query_embedding,
                "match_threshold": 0.1, # Lowered from 0.5
                "match_count": 5,
                "filter_document_id": document_id
            }).execute()
            
        res = await run_in_threadpool(search_db)
        
        matched_chunks = res.data
        print(f"Query: {query}")
        print(f"Matches found: {len(matched_chunks)}")
        
        if not matched_chunks:
            print("No matches found above threshold.")
            return {"answer": "I couldn't find any relevant information in the document to answer your question."}

        # 3. Construct Context for LLM
        context_text = "\n\n---\n\n".join([chunk['content'] for chunk in matched_chunks])
        
        # 4. Generate Answer using GPT-4o (Async)
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant answering questions about a document. Use the provided context to answer the user's question. If the answer is not in the context, say you don't know."
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context_text}\n\nQuestion: {query}"
                }
            ]
        )
        
        return {"answer": response.choices[0].message.content}

    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
