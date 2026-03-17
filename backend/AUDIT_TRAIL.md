# Audit Trail System

## Overview

The Olive Garden Gateway API includes a comprehensive audit trail system that tracks all significant operations across the platform. This system follows industry best practices for audit logging, providing complete traceability and accountability.

## Features

### Core Capabilities
- **Automatic Request Tracking**: All API requests are automatically logged via middleware
- **Manual Audit Logging**: Controllers can add custom audit entries for specific operations
- **Comprehensive Filtering**: Query audit logs by user, action, resource, date range, and more
- **Performance Tracking**: Records request duration for performance analysis
- **Security Monitoring**: Tracks failed operations and suspicious activities
- **Data Retention**: Configurable retention policy with automated cleanup

### Audit Log Schema (5W Framework)

Each audit log entry captures:

1. **WHO** - User identification
   - `user_id`: UUID of the user
   - `user_email`: Email address
   - `user_role`: User's role (admin, user, moderator)

2. **WHAT** - Action details
   - `action`: Type of operation (CREATE, READ, UPDATE, DELETE, LOGIN, etc.)
   - `resource_type`: Type of resource (USER, BOOKING, GALLERY, ANALYTICS, etc.)
   - `resource_id`: Specific resource identifier

3. **WHEN** - Timestamp
   - `timestamp`: When the action occurred
   - `created_at`: Log entry creation time

4. **WHERE** - Request context
   - `ip_address`: Client IP address
   - `user_agent`: Browser/client information
   - `endpoint`: API endpoint path
   - `http_method`: HTTP method (GET, POST, PUT, DELETE)

5. **WHY/DETAILS** - Additional context
   - `description`: Human-readable description
   - `changes`: JSON object with before/after values
   - `metadata`: Additional contextual information
   - `status`: Operation status (success, failure, pending)
   - `error_message`: Error details if failed
   - `duration_ms`: Request processing time

## API Endpoints

All audit endpoints require admin authentication.

### Get Audit Logs
```
GET /api/audit/logs
```

Query Parameters:
- `user_id`: Filter by user ID
- `user_email`: Filter by user email (partial match)
- `action`: Filter by action type
- `resource_type`: Filter by resource type
- `resource_id`: Filter by specific resource
- `status`: Filter by status (success/failure)
- `start_date`: Start date for date range
- `end_date`: End date for date range
- `ip_address`: Filter by IP address
- `search`: Search in description and endpoint
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)
- `sort_by`: Sort field (default: timestamp)
- `sort_order`: Sort order (asc/desc, default: desc)

### Get Audit Statistics
```
GET /api/audit/stats
```

Returns aggregated statistics:
- Total logs count
- Logs by action type
- Logs by resource type
- Logs by status
- Top users by activity
- Recent failures count
- Average request duration

### Get Resource Audit History
```
GET /api/audit/resource/:resourceType/:resourceId
```

Returns audit history for a specific resource.

### Get User Audit History
```
GET /api/audit/user/:userId
```

Returns audit history for a specific user.

### Get Recent Activity
```
GET /api/audit/recent
```

Returns audit logs from the last 7 days.

### Get Failed Operations
```
GET /api/audit/failures
```

Returns all failed operations for security monitoring.

### Cleanup Old Logs
```
POST /api/audit/cleanup
```

Body:
```json
{
  "retention_days": 365
}
```

Removes audit logs older than the specified retention period.

## Usage Examples

### Automatic Logging

All API requests are automatically logged via middleware. No additional code required.

```typescript
// User creates a booking
POST /api/bookings
// Automatically creates audit log:
// - action: CREATE
// - resource_type: BOOKING
// - user info from JWT token
// - request details (IP, user agent, etc.)
```

### Manual Logging in Controllers

For operations requiring custom audit entries:

```typescript
import { logManualAudit } from '../middleware/audit.middleware';
import { AuditAction, AuditResourceType, AuditStatus } from '../types/audit';

// In your controller method
await logManualAudit(
  req,
  AuditAction.APPROVE,
  AuditResourceType.BOOKING,
  bookingId,
  {
    description: 'Booking approved by admin',
    changes: { status: { from: 'pending', to: 'confirmed' } },
    metadata: { reason: 'Payment verified' },
    status: AuditStatus.SUCCESS,
  }
);
```

### Using Audit Service Directly

```typescript
import { AuditService } from '../utils/audit.service';
import { AuditAction, AuditResourceType } from '../types/audit';

// Log a successful operation
await AuditService.logSuccess(
  AuditAction.UPDATE,
  AuditResourceType.USER,
  userId,
  req.user?.id,
  req.user?.email,
  req.user?.role,
  {
    ip_address: getClientIp(req),
    endpoint: req.path,
    description: 'User profile updated',
    changes: { email: { from: oldEmail, to: newEmail } },
  }
);

// Log a failed operation
await AuditService.logFailure(
  AuditAction.DELETE,
  AuditResourceType.BOOKING,
  error,
  req.user?.id,
  req.user?.email,
  req.user?.role,
  {
    ip_address: getClientIp(req),
    endpoint: req.path,
    description: 'Failed to delete booking',
  }
);
```

## Database Setup

Run the audit schema migration:

```bash
psql -U your_username -d olive_garden_db -f database/audit-schema.sql
```

Or use your preferred database migration tool.

## Security Considerations

1. **Access Control**: Only admins can access audit logs
2. **Sensitive Data**: Passwords and tokens are automatically filtered from changes
3. **IP Tracking**: Client IP addresses are logged for security analysis
4. **Immutable Logs**: Audit logs should never be modified, only created
5. **Retention Policy**: Implement appropriate retention based on compliance requirements

## Performance Optimization

1. **Indexes**: Comprehensive indexes on frequently queried fields
2. **Async Logging**: Audit logging doesn't block request processing
3. **Selective Logging**: READ operations on analytics are skipped to reduce volume
4. **Partitioning**: Consider table partitioning for high-volume systems
5. **Cleanup Jobs**: Schedule regular cleanup of old logs

## Compliance

This audit trail system supports compliance with:
- **GDPR**: Track data access and modifications
- **SOC 2**: Comprehensive activity logging
- **HIPAA**: Audit trail requirements
- **PCI DSS**: Access logging and monitoring

## Monitoring and Alerts

Consider setting up alerts for:
- High number of failed operations
- Unusual access patterns
- Operations from suspicious IP addresses
- Bulk deletions or modifications
- After-hours administrative actions

## Best Practices

1. **Regular Review**: Periodically review audit logs for anomalies
2. **Retention Policy**: Define and enforce appropriate retention periods
3. **Backup**: Include audit logs in backup strategy
4. **Access Logs**: Monitor who accesses audit logs themselves
5. **Documentation**: Document any manual audit log queries or exports

## Troubleshooting

### Audit logs not appearing
- Verify database connection
- Check that audit middleware is properly registered
- Ensure audit_logs table exists

### Performance issues
- Review and optimize database indexes
- Consider implementing table partitioning
- Adjust retention policy to reduce table size
- Use pagination when querying large result sets

### Missing user information
- Verify JWT token is properly decoded
- Check that auth middleware runs before audit middleware
- Ensure user object is attached to request

## Future Enhancements

Potential improvements:
- Real-time audit log streaming
- Advanced anomaly detection
- Automated compliance reporting
- Integration with SIEM systems
- Audit log encryption at rest
- Blockchain-based immutability proof
