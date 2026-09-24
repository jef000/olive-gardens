-- Notifications Schema
-- Comprehensive notification system for Olive Garden Gateway

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'booking_created',
  'booking_updated',
  'booking_confirmed',
  'booking_cancelled',
  'booking_completed',
  'payment_received',
  'payment_pending',
  'user_created',
  'user_updated',
  'user_deleted',
  'gallery_upload',
  'gallery_deleted',
  'inquiry_received',
  'system_alert',
  'admin_action'
);

-- Notification priority enum
CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Target user (null = all admins/moderators)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Related resource information
  resource_type VARCHAR(50), -- 'booking', 'user', 'gallery', etc.
  resource_id UUID,
  
  -- Notification metadata
  data JSONB DEFAULT '{}',
  
  -- Status tracking
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Indexing
  CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_resource ON notifications(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Function to auto-delete expired notifications
CREATE OR REPLACE FUNCTION delete_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up expired notifications
-- This would typically be done via pg_cron or application-level cron job
COMMENT ON FUNCTION delete_expired_notifications() IS 'Deletes notifications that have passed their expiration date';
