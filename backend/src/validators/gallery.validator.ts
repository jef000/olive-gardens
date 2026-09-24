import { z } from 'zod';

export const galleryAlbums = [
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
  'Other',
] as const;

export const createGalleryImageSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  alt_text: z.string().trim().max(300).optional(),
  description: z.string().max(2000).optional(),
  url: z.string().trim().min(1, 'URL is required').max(1000),
  thumbnail_url: z.string().trim().max(1000).optional(),
  album: z.enum(galleryAlbums),
  category: z.string().trim().max(100).optional(),
  tags: z.array(z.string().trim().max(50)).max(20).optional(),
  file_size: z.coerce.number().int().min(0).optional(),
  file_type: z.string().trim().max(100).optional(),
  width: z.coerce.number().int().min(0).optional(),
  height: z.coerce.number().int().min(0).optional(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
});

export const updateGalleryImageSchema = createGalleryImageSchema.partial();

export type CreateGalleryImageInput = z.infer<typeof createGalleryImageSchema>;
