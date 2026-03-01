from fastapi import APIRouter, HTTPException, Body, Depends
from fastapi.concurrency import run_in_threadpool
from app.core.config import settings
from app.services.supabase import supabase
from app.services.ai_service import generate_embedding
from app.dependencies.auth import get_current_user
from app.core.logging_config import get_logger
from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

logger = get_logger(__name__)
router = APIRouter()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# --- Data Models ---

class CreateSessionRequest(BaseModel):
    title: str = "New Chat"

class ChatSession(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime

class ChatMessage(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

class SendMessageRequest(BaseModel):
    content: str

# --- Endpoints ---

@router.get("/sessions", response_model=List[ChatSession])
async def get_sessions(user = Depends(get_current_user)):
    try:
        response = supabase.table("chat_sessions")\
            .select("*")\
            .eq("user_id", user.id)\
            .order("updated_at", desc=True)\
            .execute()
        return response.data
    except Exception as e:
        logger.error("Failed to get sessions", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve chat sessions.")

@router.post("/sessions", response_model=ChatSession)
async def create_session(request: CreateSessionRequest, user = Depends(get_current_user)):
    try:
        response = supabase.table("chat_sessions")\
            .insert({"user_id": user.id, "title": request.title})\
            .execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create session")
        return response.data[0]
    except Exception as e:
        logger.error("Failed to create session", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create chat session.")

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user = Depends(get_current_user)):
    try:
        # Verify ownership
        session = supabase.table("chat_sessions").select("id").eq("id", session_id).eq("user_id", user.id).single().execute()
        if not session.data:
            raise HTTPException(status_code=404, detail="Session not found")

        supabase.table("chat_sessions").delete().eq("id", session_id).execute()
        return {"message": "Session deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete session", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete chat session.")

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessage])
async def get_session_messages(session_id: str, user = Depends(get_current_user)):
    try:
        # Verify ownership
        session = supabase.table("chat_sessions").select("id").eq("id", session_id).eq("user_id", user.id).single().execute()
        if not session.data:
            raise HTTPException(status_code=404, detail="Session not found")

        response = supabase.table("chat_messages")\
            .select("*")\
            .eq("session_id", session_id)\
            .order("created_at", desc=False)\
            .execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get session messages", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve messages.")

@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, request: SendMessageRequest, user = Depends(get_current_user)):
    try:
        # 0. Check chat quota
        from app.core.quotas import check_chat_quota
        await check_chat_quota(user.id)

        # 1. Verify session ownership
        session = supabase.table("chat_sessions").select("id, title").eq("id", session_id).eq("user_id", user.id).single().execute()
        if not session.data:
            raise HTTPException(status_code=404, detail="Session not found")

        # 2. Store User Message
        user_msg = supabase.table("chat_messages").insert({
            "session_id": session_id,
            "role": "user",
            "content": request.content
        }).execute()

        # 2b. Fetch Chat History for Contextualization
        recent_messages = supabase.table("chat_messages")\
            .select("role, content")\
            .eq("session_id", session_id)\
            .order("created_at", desc=True)\
            .limit(6)\
            .execute()
        
        history_context = ""
        if recent_messages.data:
            # Reverse to get chronological order
            msgs = recent_messages.data[::-1]
            history_context = "\n".join([f"{m['role']}: {m['content']}" for m in msgs])

        search_query_raw = request.content # Default to original query if no rewrite needed

        if history_context:
            try:
                # Rewrite query
                rewrite_response = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant. Given the chat history and the latest user question, rewrite the question to be a self-contained search query. \n\nIMPORTANT: If the user asks to compare two different documents (e.g. 'invoice vs PO', 'receipt vs policy'), or if the answer requires finding a specific reference document, generate MULTIPLE search queries separated by ' | '. \n\nExample:\nUser: 'Does the invoice match the PO?'\nOutput: 'Invoice details from latest conversation | Purchase Order for Vendor X'\n\nIf the question contains coreferences (it, they, them, that), resolve them using the history. Do not answer the question, just rewrite it for search."},
                        {"role": "user", "content": f"History:\n{history_context}\n\nLatest Question: {request.content}\n\nSearch Query:"}
                    ]
                )
                search_query_raw = rewrite_response.choices[0].message.content.strip()
                logger.debug(f"Rewritten Query Raw: '{search_query_raw}'")
            except Exception as e:
                logger.warning(f"Query rewriting failed: {e}")
                
        # 3. Retrieve Context (RAG) - Multi-Query Support
        search_queries = [q.strip() for q in search_query_raw.split('|')]
        all_matched_chunks = {} # Deduplication by chunk ID
        
        for q in search_queries:
            if not q: continue
            logger.debug(f"Executing RAG search: '{q}'")
            query_embedding = await generate_embedding(q)
            
            if query_embedding:
                res = supabase.rpc("match_documents", {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.1,
                    "match_count": 8, # Slightly reduced per query to avoid context overflow
                    "filter_document_id": None,
                    "filter_user_id": user.id
                }).execute()
                
                for chunk in res.data:
                    all_matched_chunks[chunk['id']] = chunk

        matched_chunks = list(all_matched_chunks.values())
        
        # Construct enhanced context with source metadata
        context_parts = []
        for chunk in matched_chunks:
            source = chunk.get('document_name', 'Unknown Document')
            date_str = chunk.get('document_created_at', '')
            if date_str:
                try:
                    # Simple date formatting
                    date_val = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    date_fmt = date_val.strftime("%Y-%m-%d")
                except:
                    date_fmt = date_str
            else:
                date_fmt = "N/A"
                
            context_parts.append(f"Source: {source} (Date: {date_fmt})\nContent: {chunk['content']}")
            
        context_text = "\n\n---\n\n".join(context_parts)
        
        # 4. Generate AI Response
        current_date_str = datetime.now().strftime("%Y-%m-%d")
        system_prompt = f"You are a helpful assistant answering questions about a document. The current date is {current_date_str}. When comparing monetary amounts in different currencies (e.g. INR, EUR, GBP), ALWAYS convert them to a common currency (USD) using approximate current market exchange rates. Use the provided context to answer the user's question. If the user asks to compare against a specific document (like a PO or Policy) and you cannot find it in the context, EXPLICITLY state that you could not find the reference document. If the answer is not in the context, say you don't know."
        if not context_text:
             system_prompt += " NOTE: No relevant documents were found for this query."
        
        ai_response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion: {request.content}"}
            ]
        )
        ai_content = ai_response.choices[0].message.content

        # 5. Store AI Message
        supabase.table("chat_messages").insert({
            "session_id": session_id,
            "role": "assistant",
            "content": ai_content
        }).execute()

        # 6. Update Session Timestamp
        supabase.table("chat_sessions").update({"updated_at": "now()"}).eq("id", session_id).execute()

        # 7. Auto-title session if it's the first message and title is "New Chat"
        if session.data['title'] == "New Chat":
            try:
                title_response = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "Generate a very short title (max 5 words) for this chat session based on the user's first message. Do not use quotes."},
                        {"role": "user", "content": request.content}
                    ],
                    max_tokens=15
                )
                new_title = title_response.choices[0].message.content.strip()
                supabase.table("chat_sessions").update({"title": new_title}).eq("id", session_id).execute()
            except Exception as e:
                logger.warning(f"Auto-titling failed: {e}")

        return {"role": "assistant", "content": ai_content}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Chat error", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process chat message.")

# Keep existing single-doc chat endpoint for backward compatibility if needed, 
# or remove/refactor. The frontend 'Chat' component uses: /api/chat/{documentId}
# We should preserve it for the Document Detail page logic.

@router.post("/{document_id}")
async def chat_with_document(
    document_id: str, 
    query: str = Body(..., embed=True),
    user = Depends(get_current_user)
):
    # ... (Keep existing logic for single document chat) ...
    try:
        # 1. Generate embedding for the query (Async)
        query_embedding = await generate_embedding(query)
        if not query_embedding:
            raise HTTPException(status_code=500, detail="Failed to generate embedding for query")

        # 2. Search for relevant document chunks (Blocking DB call -> Thread Pool)
        def search_db():
            filter_id = document_id if document_id != "all" else None
            
            return supabase.rpc("match_documents", {
                "query_embedding": query_embedding,
                "match_threshold": 0.1, # Lowered from 0.5
                "match_count": 5,
                "filter_document_id": filter_id,
                "filter_user_id": user.id
            }).execute()
            
        res = await run_in_threadpool(search_db)
        
        matched_chunks = res.data
        
        if not matched_chunks:
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

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Document chat error", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process document chat.")
