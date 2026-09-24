-- Migration: Create file uploads tracking table
-- Date: 2024-01-15
-- Description: Creates table for tracking uploaded files with security validation metadata

-- Create file_uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename VARCHAR(500) NOT NULL,
  stored_filename VARCHAR(500) UNIQUE NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  magic_number_validated BOOLEAN DEFAULT FALSE,
  malware_scanned BOOLEAN DEFAULT FALSE,
  upload_ip INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_created ON file_uploads(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_stored_filename ON file_uploads(stored_filename);

-- Add comments for documentation
COMMENT ON TABLE file_uploads IS 'Tracks all uploaded files with security validation metadata';
COMMENT ON COLUMN file_uploads.id IS 'Unique file upload identifier';
COMMENT ON COLUMN file_uploads.user_id IS 'User who uploaded the file';
COMMENT ON COLUMN file_uploads.original_filename IS 'Original filename provided by user';
COMMENT ON COLUMN file_uploads.stored_filename IS 'Randomized filename stored on server (unique)';
COMMENT ON COLUMN file_uploads.file_size IS 'File size in bytes';
COMMENT ON COLUMN file_uploads.mime_type IS 'MIME type of the file';
COMMENT ON COLUMN file_uploads.magic_number_validated IS 'Whether magic number validation passed';
COMMENT ON COLUMN file_uploads.malware_scanned IS 'Whether file was scanned for malware';
COMMENT ON COLUMN file_uploads.upload_ip IS 'IP address from which file was uploaded';
COMMENT ON COLUMN file_uploads.created_at IS 'Timestamp when file was uploaded';
