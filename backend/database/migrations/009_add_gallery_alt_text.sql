-- Migration: Store accessible alternative text for gallery images
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS alt_text VARCHAR(125);
UPDATE gallery_images SET alt_text = LEFT(COALESCE(NULLIF(title, ''), 'Gallery image'), 125) WHERE alt_text IS NULL;
COMMENT ON COLUMN gallery_images.alt_text IS 'Accessible alternative text for gallery images';
