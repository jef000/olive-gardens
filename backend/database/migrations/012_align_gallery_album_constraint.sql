-- Migration: Align the gallery album constraint with the admin album structure
-- Date: 2026-09-18
-- Description: The admin UI offers Gardens and its four sub-albums
-- (Garden of Eden, Mount Sinai Prayer Area, Picnic Grounds, Camping Grounds),
-- but the CHECK constraint only allowed six older values, so every upload to a
-- Garden album failed after the files were already written. Garden Hall is
-- retained for pre-existing rows.

ALTER TABLE gallery_images DROP CONSTRAINT IF EXISTS gallery_images_album_check;
ALTER TABLE gallery_images ADD CONSTRAINT gallery_images_album_check CHECK (
  album IN (
    'Main Arena',
    'Garden Hall',
    'Gardens',
    'Garden of Eden',
    'Mount Sinai Prayer Area',
    'Picnic Grounds',
    'Camping Grounds',
    'Therapy Room',
    'Events',
    'Facilities',
    'Other'
  )
);
