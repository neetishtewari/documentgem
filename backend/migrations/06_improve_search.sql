-- Drop existing function to recreate with new return type
drop function if exists match_documents;

-- Re-create match_documents to return document metadata
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_document_id uuid default null,
  filter_user_id uuid default auth.uid()
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  document_name text,
  document_created_at timestamptz
)
language plpgsql
as $$
begin
  return query
  select
    document_embeddings.id,
    document_embeddings.document_id,
    document_embeddings.content,
    1 - (document_embeddings.embedding <=> query_embedding) as similarity,
    documents.name as document_name,
    documents.created_at as document_created_at
  from document_embeddings
  join documents on documents.id = document_embeddings.document_id
  where 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  and (filter_document_id is null or document_embeddings.document_id = filter_document_id)
  -- The documents.user_id check is implicit if we assume embeddings.user_id matches, 
  -- but safer to check embedings.user_id as per previous logic
  and (document_embeddings.user_id = filter_user_id)
  order by document_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
