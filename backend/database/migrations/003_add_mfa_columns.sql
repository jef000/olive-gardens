-- Migration: Add Multi-Factor Authentication columns
-- Date: 2024-01-15
-- Description: Adds fields to support TOTP-based MFA and backup codes

-- Add MFA fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;

-- Create index for better query performance on MFA-enabled users
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled) WHERE mfa_enabled = TRUE;

-- Update existing users to have default MFA disabled
UPDATE users 
SET mfa_enabled = FALSE
WHERE mfa_enabled IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.mfa_enabled IS 'Whether multi-factor authentication is enabled for this user';
COMMENT ON COLUMN users.mfa_secret IS 'TOTP secret key for MFA (encrypted)';
COMMENT ON COLUMN users.mfa_backup_codes IS 'JSON array of hashed backup codes for account recovery';
