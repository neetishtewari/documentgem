-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store document chunks and their embeddings
create table if not exists document_embeddings (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade,
  content text, -- The text chunk
  embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table document_embeddings enable row level security;

-- Create a policy that allows all operations for now
create policy "Enable all access for all users" on document_embeddings
  for all using (true) with check (true);

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_document_id uuid default null
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
  order by document_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
