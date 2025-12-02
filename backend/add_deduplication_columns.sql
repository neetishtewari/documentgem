-- Add content_hash column to store SHA-256 hash of the file
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS content_hash text;

-- Add is_duplicate column to flag duplicate files
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false;

-- Create an index on content_hash and user_id for faster duplicate lookups
CREATE INDEX IF NOT EXISTS idx_documents_content_hash_user_id 
ON documents (content_hash, user_id);
