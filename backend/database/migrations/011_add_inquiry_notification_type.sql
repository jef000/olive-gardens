-- Migration: Add the inquiry_received notification type
-- Date: 2026-09-18
-- Description: The service emits inquiry_received for new contact-form
-- submissions, but the enum shipped without it, so every inquiry notification
-- insert failed silently. The schema file now includes the value; this migration
-- upgrades databases created before the fix.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'inquiry_received';
