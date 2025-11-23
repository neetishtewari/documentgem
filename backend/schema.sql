-- Create the documents table
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  file_path text not null,
  type text not null,
  size bigint not null,
  category text,
  summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table documents enable row level security;

-- Create a policy that allows all operations for now (for development)
-- In production, you should restrict this to authenticated users
create policy "Enable all access for all users" on documents
  for all using (true) with check (true);
