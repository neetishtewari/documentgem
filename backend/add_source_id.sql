ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_id TEXT;
CREATE INDEX IF NOT EXISTS idx_documents_source_id ON documents(source_id);
