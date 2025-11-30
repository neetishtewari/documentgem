ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Upload',
ADD COLUMN IF NOT EXISTS source_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have source_date = created_at if null
UPDATE documents SET source_date = created_at WHERE source_date IS NULL;
