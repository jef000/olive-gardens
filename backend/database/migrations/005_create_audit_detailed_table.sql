-- Migration: Create detailed audit logging table
-- Date: 2024-01-15
-- Description: Creates comprehensive audit logging table for security and compliance

-- Create audit_detailed table
CREATE TABLE IF NOT EXISTS audit_detailed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID,
  request_id VARCHAR(255),
  operation_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  http_method VARCHAR(10),
  endpoint VARCHAR(500),
  ip_address INET,
  user_agent TEXT,
  status_code INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_detailed(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_detailed(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_operation_type ON audit_detailed(operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_resource_type ON audit_detailed(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_request_id ON audit_detailed(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_success ON audit_detailed(success) WHERE success = FALSE;
CREATE INDEX IF NOT EXISTS idx_audit_user_created ON audit_detailed(user_id, created_at);

-- Create GIN index for JSONB changes column for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_audit_changes_gin ON audit_detailed USING GIN (changes);

-- Add comments for documentation
COMMENT ON TABLE audit_detailed IS 'Comprehensive audit log for all security-relevant operations';
COMMENT ON COLUMN audit_detailed.id IS 'Unique audit entry identifier';
COMMENT ON COLUMN audit_detailed.user_id IS 'User who performed the operation (NULL for system operations)';
COMMENT ON COLUMN audit_detailed.session_id IS 'Session identifier for correlating related operations';
COMMENT ON COLUMN audit_detailed.request_id IS 'Unique request identifier for tracing';
COMMENT ON COLUMN audit_detailed.operation_type IS 'Type of operation (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, ACCESS)';
COMMENT ON COLUMN audit_detailed.resource_type IS 'Type of resource affected (USER, BOOKING, GALLERY, etc.)';
COMMENT ON COLUMN audit_detailed.resource_id IS 'Identifier of the affected resource';
COMMENT ON COLUMN audit_detailed.http_method IS 'HTTP method (GET, POST, PUT, DELETE, PATCH)';
COMMENT ON COLUMN audit_detailed.endpoint IS 'API endpoint accessed';
COMMENT ON COLUMN audit_detailed.ip_address IS 'IP address of the client';
COMMENT ON COLUMN audit_detailed.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN audit_detailed.status_code IS 'HTTP response status code';
COMMENT ON COLUMN audit_detailed.success IS 'Whether the operation succeeded';
COMMENT ON COLUMN audit_detailed.error_message IS 'Error message if operation failed';
COMMENT ON COLUMN audit_detailed.changes IS 'JSON object containing before/after values for data changes';
COMMENT ON COLUMN audit_detailed.created_at IS 'Timestamp when operation occurred';
