-- Migration: Add performance indexes
-- Date: 2024-01-15
-- Description: Adds composite indexes for frequently queried columns to improve performance

-- ============================================
-- BOOKINGS TABLE INDEXES
-- ============================================

-- Composite index for searching bookings by guest email and check-in date
-- Supports queries like: "Find all bookings for this email in this date range"
CREATE INDEX IF NOT EXISTS idx_bookings_client_email_event_date 
ON bookings(client_email, event_date);

-- Composite index for filtering bookings by status and date
-- Supports queries like: "Find all confirmed bookings in the next month"
CREATE INDEX IF NOT EXISTS idx_bookings_status_event_date 
ON bookings(status, event_date);

-- Additional useful composite index for date range queries with status
CREATE INDEX IF NOT EXISTS idx_bookings_event_date_status 
ON bookings(event_date DESC, status);

-- ============================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================

-- Composite index for fetching unread notifications for a user ordered by date
-- This index already exists in notifications-schema.sql: idx_notifications_user_unread
-- We'll create an additional variant if needed
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- GALLERY TABLE INDEXES
-- ============================================

-- Composite index for filtering gallery by uploader and date
-- Supports queries like: "Show all images uploaded by this user, newest first"
CREATE INDEX IF NOT EXISTS idx_gallery_uploaded_by_created 
ON gallery_images(uploaded_by, created_at DESC);

-- Composite index for published images by album and date
-- Supports queries like: "Show all published images in this album, newest first"
CREATE INDEX IF NOT EXISTS idx_gallery_album_published_created 
ON gallery_images(album, is_published, created_at DESC) 
WHERE is_published = TRUE;

-- Index for featured images ordering
CREATE INDEX IF NOT EXISTS idx_gallery_featured_created 
ON gallery_images(created_at DESC) 
WHERE is_featured = TRUE;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_bookings_client_email_event_date IS 'Improves performance for booking searches by email and date range';
COMMENT ON INDEX idx_bookings_status_event_date IS 'Improves performance for filtering bookings by status and date';
COMMENT ON INDEX idx_bookings_event_date_status IS 'Improves performance for date-based booking queries with status filter';
COMMENT ON INDEX idx_notifications_user_read_created IS 'Improves performance for fetching user notifications sorted by read status and date';
COMMENT ON INDEX idx_gallery_uploaded_by_created IS 'Improves performance for user-specific gallery queries';
COMMENT ON INDEX idx_gallery_album_published_created IS 'Improves performance for album-based published image queries';
COMMENT ON INDEX idx_gallery_featured_created IS 'Improves performance for featured image queries';
