-- Create alerts table
create table if not exists alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  document_id uuid references documents(id) on delete set null,
  type text not null, -- 'expiry', 'system', 'info'
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table alerts enable row level security;

-- Policies
create policy "Users can view their own alerts"
  on alerts for select
  using (auth.uid() = user_id);

create policy "Users can update their own alerts"
  on alerts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own alerts"
  on alerts for delete
  using (auth.uid() = user_id);
