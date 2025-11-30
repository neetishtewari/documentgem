-- Create table for storing user integration tokens
create table if not exists user_integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null, -- 'gmail', 'google_drive'
  access_token text not null,
  refresh_token text not null,
  config jsonb default '{}'::jsonb,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one integration per provider per user
  unique(user_id, provider)
);

-- Enable RLS
alter table user_integrations enable row level security;

-- Create policies
create policy "Users can view their own integrations"
  on user_integrations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own integrations"
  on user_integrations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own integrations"
  on user_integrations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own integrations"
  on user_integrations for delete
  using (auth.uid() = user_id);
