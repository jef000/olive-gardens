-- Migration: Create service_prices table
-- Date: 2026-09-23
-- Description: Stores the price label shown next to each service on the public
-- website. Admins edit these values in the operations portal, so rate changes
-- never require a redeploy. Service ids match the booking space ids used by
-- the frontend (e.g. main-arena, gardens, individual-counselling,
-- group-workshops).

CREATE TABLE IF NOT EXISTS service_prices (
  service_id VARCHAR(100) PRIMARY KEY,
  price VARCHAR(120) NOT NULL DEFAULT '',
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_prices IS 'Admin-managed price labels displayed on the public services page';
COMMENT ON COLUMN service_prices.service_id IS 'Stable service/booking-space identifier (matches frontend service ids)';
COMMENT ON COLUMN service_prices.price IS 'Display price label, e.g. "From KES 150,000". Empty string renders as "Rates on request"';

-- Seed the current published values so the website keeps working after deploy.
INSERT INTO service_prices (service_id, price) VALUES
  ('main-arena', 'From KES 150,000'),
  ('gardens', ''),
  ('individual-counselling', 'KES 5,000 per session'),
  ('group-workshops', 'From KES 3,000 per person')
ON CONFLICT (service_id) DO NOTHING;

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_service_prices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_service_prices_updated_at ON service_prices;
CREATE TRIGGER update_service_prices_updated_at
  BEFORE UPDATE ON service_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_service_prices_timestamp();
