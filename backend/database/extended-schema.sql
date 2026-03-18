-- Extended Olive Garden Database Schema
-- Bookings, Gallery, and Analytics Tables

-- ============================================
-- BOOKINGS TABLE
-- ============================================
DROP TABLE IF EXISTS bookings CASCADE;

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  
  -- Client Information
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  
  -- Event Details
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL CHECK (event_type IN ('Wedding', 'Corporate', 'Workshop', 'Session', 'Conference', 'Party', 'Other')),
  venue VARCHAR(100) NOT NULL CHECK (venue IN ('Main Arena', 'Garden Hall', 'Therapy Room', 'Conference Room')),
  
  -- Booking Dates
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  
  -- Pricing
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  deposit_amount DECIMAL(10, 2) DEFAULT 0.00,
  balance_amount DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  
  -- Additional Details
  guest_count INTEGER,
  special_requests TEXT,
  notes TEXT,
  
  -- Relationships
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for bookings
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_client_email ON bookings(client_email);
CREATE INDEX idx_bookings_event_date ON bookings(event_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_venue ON bookings(venue);
CREATE INDEX idx_bookings_event_type ON bookings(event_type);

-- Trigger for bookings updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INQUIRIES TABLE
-- ============================================
DROP TABLE IF EXISTS inquiries CASCADE;

CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inquiries_email ON inquiries(email);
CREATE INDEX idx_inquiries_status ON inquiries(status);

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GALLERY TABLE
-- ============================================
DROP TABLE IF EXISTS gallery_images CASCADE;

CREATE TABLE gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Image Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Organization
  album VARCHAR(100) NOT NULL CHECK (album IN ('Main Arena', 'Garden Hall', 'Therapy Room', 'Events', 'Facilities', 'Other')),
  category VARCHAR(100),
  tags TEXT[], -- Array of tags
  
  -- Metadata
  file_size INTEGER, -- in bytes
  file_type VARCHAR(50),
  width INTEGER,
  height INTEGER,
  
  -- Status
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  
  -- Relationships
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for gallery
CREATE INDEX idx_gallery_album ON gallery_images(album);
CREATE INDEX idx_gallery_category ON gallery_images(category);
CREATE INDEX idx_gallery_is_featured ON gallery_images(is_featured);
CREATE INDEX idx_gallery_is_published ON gallery_images(is_published);
CREATE INDEX idx_gallery_uploaded_by ON gallery_images(uploaded_by);

-- Trigger for gallery updated_at
DROP TRIGGER IF EXISTS update_gallery_updated_at ON gallery_images;
CREATE TRIGGER update_gallery_updated_at
  BEFORE UPDATE ON gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ANALYTICS TABLE
-- ============================================
DROP TABLE IF EXISTS analytics_events CASCADE;

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- e.g., 'page_view', 'booking_created', 'user_registered'
  event_category VARCHAR(100), -- e.g., 'engagement', 'conversion', 'revenue'
  event_action VARCHAR(255), -- e.g., 'click', 'submit', 'view'
  event_label VARCHAR(255),
  
  -- Event Data (JSON for flexibility)
  event_data JSONB,
  
  -- User Context
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Page Context
  page_url TEXT,
  page_title VARCHAR(255),
  referrer TEXT,
  
  -- Metrics
  value DECIMAL(10, 2), -- For revenue tracking
  duration INTEGER, -- For time-based events (in seconds)
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_event_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_session_id ON analytics_events(session_id);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Sample Bookings
INSERT INTO bookings (booking_reference, client_name, client_email, client_phone, event_name, event_type, venue, event_date, start_time, end_time, total_amount, deposit_amount, balance_amount, status, payment_status, guest_count, special_requests)
VALUES 
  ('BK-1001', 'John Njiru', 'john.njiru@email.com', '+254712345678', 'Njiru Wedding Reception', 'Wedding', 'Main Arena', '2024-02-15', '14:00', '22:00', 450000.00, 150000.00, 300000.00, 'confirmed', 'partial', 250, 'Need floral decorations and catering for 250 guests'),
  ('BK-1002', 'Sarah Wanjiku', 'sarah.w@company.com', '+254723456789', 'Corporate Annual Gala', 'Corporate', 'Garden Hall', '2024-02-20', '18:00', '23:00', 320000.00, 320000.00, 0.00, 'confirmed', 'paid', 180, 'Require AV equipment and stage setup'),
  ('BK-1003', 'David Kamau', 'david.kamau@email.com', '+254734567890', 'Mental Health Workshop', 'Workshop', 'Therapy Room', '2024-02-18', '09:00', '17:00', 85000.00, 0.00, 85000.00, 'pending', 'unpaid', 40, 'Need projector and comfortable seating'),
  ('BK-1004', 'Grace Achieng', 'grace.a@email.com', '+254745678901', 'Birthday Celebration', 'Party', 'Garden Hall', '2024-03-05', '15:00', '20:00', 125000.00, 50000.00, 75000.00, 'confirmed', 'partial', 80, 'Outdoor setup preferred if weather permits');

-- Sample Gallery Images
INSERT INTO gallery_images (title, description, url, thumbnail_url, album, category, tags, is_featured, is_published)
VALUES 
  ('Main Arena Wedding Setup', 'Beautiful wedding setup under the canopy with floral arrangements', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400', 'Main Arena', 'Weddings', ARRAY['wedding', 'setup', 'canopy'], true, true),
  ('Garden Hall Corporate Event', 'Professional corporate event setup with stage and lighting', 'https://images.unsplash.com/photo-1511578314322-379afb476865', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400', 'Garden Hall', 'Corporate', ARRAY['corporate', 'event', 'professional'], true, true),
  ('Therapy Room Interior', 'Peaceful therapy room with comfortable seating', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400', 'Therapy Room', 'Facilities', ARRAY['therapy', 'wellness', 'interior'], false, true),
  ('Main Arena Night View', 'Evening ambiance with decorative lighting', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400', 'Main Arena', 'Facilities', ARRAY['evening', 'lighting', 'ambiance'], true, true);

-- Sample Analytics Events
INSERT INTO analytics_events (event_type, event_category, event_action, event_label, event_data, value)
VALUES 
  ('booking_created', 'conversion', 'submit', 'Wedding Booking', '{"venue": "Main Arena", "event_type": "Wedding"}', 450000.00),
  ('booking_created', 'conversion', 'submit', 'Corporate Booking', '{"venue": "Garden Hall", "event_type": "Corporate"}', 320000.00),
  ('page_view', 'engagement', 'view', 'Gallery Page', '{"page": "/gallery"}', NULL),
  ('user_registered', 'conversion', 'register', 'New User', '{"role": "user"}', NULL);
