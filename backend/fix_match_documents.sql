-- Drop ambiguous functions
DROP FUNCTION IF EXISTS match_documents(vector, float, int);
DROP FUNCTION IF EXISTS match_documents(vector, float, int, uuid);
DROP FUNCTION IF EXISTS match_documents(vector, float, int, uuid, uuid);

-- Create the correct function with user filtering
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_embeddings.id,
    document_embeddings.document_id,
    document_embeddings.content,
    1 - (document_embeddings.embedding <=> query_embedding) as similarity
  from document_embeddings
  join documents on documents.id = document_embeddings.document_id
  where 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  and documents.user_id = filter_user_id
  order by document_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
