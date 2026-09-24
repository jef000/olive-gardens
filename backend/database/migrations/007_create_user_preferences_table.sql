-- Migration: Create user preferences table
-- Date: 2024-01-15
-- Description: Creates table for storing user UI preferences (dark mode, sidebar state, etc.)

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dark_mode BOOLEAN DEFAULT FALSE,
  sidebar_collapsed BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for updated_at to track recent preference changes
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated ON user_preferences(updated_at);

-- Add comments for documentation
COMMENT ON TABLE user_preferences IS 'Stores user UI preferences and settings';
COMMENT ON COLUMN user_preferences.user_id IS 'Foreign key to users table (primary key)';
COMMENT ON COLUMN user_preferences.dark_mode IS 'Whether dark mode is enabled';
COMMENT ON COLUMN user_preferences.sidebar_collapsed IS 'Whether sidebar is collapsed by default';
COMMENT ON COLUMN user_preferences.notifications_enabled IS 'Whether in-app notifications are enabled';
COMMENT ON COLUMN user_preferences.preferences IS 'Additional preferences stored as JSON';
COMMENT ON COLUMN user_preferences.updated_at IS 'Timestamp of last preference update';

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_timestamp();

-- Create default preferences for existing users
INSERT INTO user_preferences (user_id, dark_mode, sidebar_collapsed, notifications_enabled)
SELECT id, FALSE, FALSE, TRUE
FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;
