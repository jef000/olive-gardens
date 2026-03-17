-- Audit Trail Schema
-- Comprehensive audit logging for all system operations

-- Drop existing audit_logs table if it exists
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Audit logs table following industry best practices (who, what, when, where, why)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- WHO: User identification
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  
  -- WHAT: Action details
  action VARCHAR(100) NOT NULL CHECK (action IN (
    'CREATE', 'READ', 'UPDATE', 'DELETE', 
    'LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'PASSWORD_CHANGE',
    'UPLOAD', 'DOWNLOAD', 'EXPORT', 'IMPORT',
    'APPROVE', 'REJECT', 'CANCEL', 'RESTORE'
  )),
  resource_type VARCHAR(100) NOT NULL CHECK (resource_type IN (
    'USER', 'BOOKING', 'GALLERY', 'ANALYTICS', 'AUTH', 'SYSTEM'
  )),
  resource_id VARCHAR(255),
  
  -- WHEN: Timestamp
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- WHERE: Request context
  ip_address VARCHAR(45),
  user_agent TEXT,
  endpoint VARCHAR(500),
  http_method VARCHAR(10),
  
  -- WHY/DETAILS: Additional context
  description TEXT,
  changes JSONB,
  metadata JSONB,
  
  -- Status and result
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  error_message TEXT,
  
  -- Performance tracking
  duration_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Composite indexes for common query patterns
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_resource_timestamp ON audit_logs(resource_type, resource_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action_timestamp ON audit_logs(action, timestamp DESC);

-- GIN index for JSONB columns for efficient JSON queries
CREATE INDEX idx_audit_logs_changes ON audit_logs USING GIN (changes);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN (metadata);

-- Partition table by timestamp for better performance (optional, for high-volume systems)
-- This can be implemented later if needed

-- Function to automatically clean up old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for recent audit activity
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT 
  id,
  user_email,
  user_role,
  action,
  resource_type,
  resource_id,
  timestamp,
  ip_address,
  description,
  status,
  endpoint
FROM audit_logs
WHERE timestamp >= NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;

-- Create a view for failed operations
CREATE OR REPLACE VIEW failed_audit_operations AS
SELECT 
  id,
  user_email,
  action,
  resource_type,
  resource_id,
  timestamp,
  ip_address,
  endpoint,
  error_message,
  status
FROM audit_logs
WHERE status = 'failure'
ORDER BY timestamp DESC;
