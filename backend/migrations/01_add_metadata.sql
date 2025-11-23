-- Add metadata column to documents table
alter table documents add column if not exists metadata jsonb default '{}'::jsonb;
