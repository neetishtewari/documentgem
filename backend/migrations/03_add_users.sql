-- Add user_id to documents table
-- We default to auth.uid() so that inserts automatically pick up the user
alter table documents add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- Update RLS for documents
drop policy if exists "Enable all access for all users" on documents;

create policy "Users can only access their own documents" on documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Add user_id to document_embeddings table
alter table document_embeddings add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- Update RLS for document_embeddings
drop policy if exists "Enable all access for all users" on document_embeddings;

create policy "Users can only access their own embeddings" on document_embeddings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Update match_documents function to filter by user_id
-- We add a filter_user_id parameter that defaults to the current authenticated user
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_document_id uuid default null,
  filter_user_id uuid default auth.uid()
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_embeddings.id,
    document_embeddings.content,
    1 - (document_embeddings.embedding <=> query_embedding) as similarity
  from document_embeddings
  where 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  and (filter_document_id is null or document_embeddings.document_id = filter_document_id)
  and (document_embeddings.user_id = filter_user_id)
  order by document_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
