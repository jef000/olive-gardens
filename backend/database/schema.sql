-- Olive Garden Gateway Database Schema
-- PostgreSQL Database Setup

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS users CASCADE;

-- Users table with authentication and password reset fields
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),

  -- Password reset fields
  reset_token TEXT,
  reset_token_expiry TIMESTAMP,

  -- Temporary password onboarding fields
  is_temporary_password BOOLEAN DEFAULT FALSE,
  temp_password_expires_at TIMESTAMP,
  must_change_password BOOLEAN DEFAULT FALSE,
  password_changed_at TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_reset_token ON users(reset_token);
CREATE INDEX idx_users_role ON users(role);

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- The first admin is NOT seeded here on purpose: a committed default password
-- is an account-takeover vector. Create it with `npm run db:setup`, which reads
-- ADMIN_EMAIL / ADMIN_PASSWORD from the environment (random password if unset)
-- and marks it must_change_password so it is rotated on first login.
