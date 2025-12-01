from fastapi import APIRouter, Depends, HTTPException, Query
from app.services.supabase import supabase
from app.services.ai_service import generate_embedding
from app.dependencies.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class SearchResult(BaseModel):
    id: str
    title: str
    type: str # 'document' or 'snippet'
    preview: str
    score: float
    metadata: Optional[dict] = {}
    date: Optional[str] = None

@router.get("/search", response_model=List[SearchResult])
async def search_documents(q: str = Query(..., min_length=1), user = Depends(get_current_user)):
    """
    Hybrid search: Combines keyword search (filenames) and vector search (content).
    """
    results = []
    seen_ids = set()
    
    print(f"DEBUG: Searching for '{q}' for user {user.id}")

    try:
        # DEBUG: Check total docs for user
        count_check = supabase.table("documents").select("id", count="exact").eq("user_id", user.id).execute()
        print(f"DEBUG: User has {count_check.count} total documents.")

        # 1. Keyword Search (Split into two queries to avoid .or_() syntax issues)
        
        # A. Name Match
        name_response = supabase.table("documents") \
            .select("*") \
            .eq("user_id", user.id) \
            .ilike("name", f"%{q}%") \
            .limit(10) \
            .execute()
            
        # B. Summary Match
        summary_response = supabase.table("documents") \
            .select("*") \
            .eq("user_id", user.id) \
            .ilike("summary", f"%{q}%") \
            .limit(10) \
            .execute()
            
        print(f"DEBUG: Name matches: {len(name_response.data)}")
        print(f"DEBUG: Summary matches: {len(summary_response.data)}")
        
        # Merge results
        combined_docs = name_response.data + summary_response.data
        
        for doc in combined_docs:
            if doc['id'] not in seen_ids:
                results.append(SearchResult(
                    id=doc['id'],
                    title=doc['name'],
                    type='document',
                    preview=doc.get('summary') or "Matches filename",
                    score=1.0, # High score for exact name match
                    metadata=doc.get('metadata'),
                    date=doc.get('source_date') or doc.get('created_at')
                ))
                seen_ids.add(doc['id'])

        # 2. Vector Search (Content)
        # Generate embedding for the query
        query_embedding = await generate_embedding(q)
        
        if query_embedding:
            # Call the RPC function 'match_documents'
            # Now passing filter_user_id to handle security at DB level
            rpc_response = supabase.rpc("match_documents", {
                "query_embedding": query_embedding,
                "match_threshold": 0.5, 
                "match_count": 10,
                "filter_user_id": str(user.id)
            }).execute()
            
            print(f"DEBUG: Vector matches (raw): {len(rpc_response.data)}")
            
            for match in rpc_response.data:
                doc_id = match['document_id']
                
                if doc_id not in seen_ids:
                    # Fetch document details (we know it belongs to user now, but still need details)
                    doc_details = supabase.table("documents") \
                        .select("name, source_date, created_at, metadata") \
                        .eq("id", doc_id) \
                        .single() \
                        .execute()
                        
                    if doc_details.data:
                        doc_data = doc_details.data
                        results.append(SearchResult(
                            id=doc_id,
                            title=doc_data['name'],
                            type='snippet',
                            preview=match['content'], 
                            score=match['similarity'],
                            metadata=doc_data.get('metadata'),
                            date=doc_data.get('source_date') or doc_data.get('created_at')
                        ))
                        seen_ids.add(doc_id)
        
        # Sort by score descending
        results.sort(key=lambda x: x.score, reverse=True)
        
        return results

    except Exception as e:
        print(f"Search error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
