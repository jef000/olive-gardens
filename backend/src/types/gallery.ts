export interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  album: 'Main Arena' | 'Garden Hall' | 'Therapy Room' | 'Events' | 'Facilities' | 'Other';
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
}
