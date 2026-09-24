-- Migration: Create inquiry_replies table
-- Date: 2026-09-17
-- Description: Stores admin replies to contact-form inquiries with delivery tracking

CREATE TABLE IF NOT EXISTS inquiry_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inquiry_replies_inquiry_id ON inquiry_replies(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_replies_status ON inquiry_replies(status);

DROP TRIGGER IF EXISTS update_inquiry_replies_updated_at ON inquiry_replies;
CREATE TRIGGER update_inquiry_replies_updated_at
  BEFORE UPDATE ON inquiry_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
