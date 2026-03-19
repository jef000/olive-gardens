-- Migration: Add temporary password onboarding fields
-- Date: 2024-01-01
-- Description: Adds fields to support secure temporary password onboarding flow

-- Add temporary password onboarding fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_temp_password_expires ON users(temp_password_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked_until);

-- Update existing users to have default values
UPDATE users 
SET 
  is_temporary_password = FALSE,
  must_change_password = FALSE,
  failed_login_attempts = 0
WHERE 
  is_temporary_password IS NULL 
  OR must_change_password IS NULL 
  OR failed_login_attempts IS NULL;
