-- Add sync status fields to user_integrations table
alter table user_integrations 
add column if not exists sync_status text default 'idle', -- 'idle', 'scanning', 'syncing', 'completed', 'error'
add column if not exists sync_progress integer default 0,
add column if not exists sync_total integer default 0,
add column if not exists sync_message text;
