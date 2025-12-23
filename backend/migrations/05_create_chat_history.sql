-- Create chat_sessions table
create table if not exists chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) default auth.uid() not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chat_messages table
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

-- RLS Policies for chat_sessions
create policy "Users can manage their own chat sessions" on chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RLS Policies for chat_messages
create policy "Users can manage messages in their own sessions" on chat_messages
  for all using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );
