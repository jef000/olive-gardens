export type GalleryAlbum =
  | 'Main Arena'
  | 'Garden Hall'
  | 'Gardens'
  | 'Garden of Eden'
  | 'Mount Sinai Prayer Area'
  | 'Picnic Grounds'
  | 'Camping Grounds'
  | 'Therapy Room'
  | 'Events'
  | 'Facilities'
  | 'Other';

export interface GalleryImage {
  id: string;
  title: string;
  alt_text?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  album: GalleryAlbum;
  category?: string;
  tags?: string[];
  file_size?: number;
  file_type?: string;
  width?: number;
  height?: number;
  is_featured: boolean;
  is_published: boolean;
  uploaded_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGalleryImageDTO {
  title: string;
  alt_text?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  album: string;
  category?: string;
  tags?: string[];
  file_size?: number;
  file_type?: string;
  width?: number;
  height?: number;
  is_featured?: boolean;
  is_published?: boolean;
}

export interface UpdateGalleryImageDTO {
  title?: string;
  alt_text?: string;
  description?: string;
  url?: string;
  thumbnail_url?: string;
  album?: string;
  category?: string;
  tags?: string[];
  is_featured?: boolean;
  is_published?: boolean;
}

export interface GalleryFilters {
  album?: string;
  category?: string;
  is_featured?: boolean;
  is_published?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
