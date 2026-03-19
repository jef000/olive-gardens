# Temporary Password Onboarding System

## Overview

This document describes the secure temporary password onboarding flow implemented for the Olive Garden Gateway application. The system enforces password change on first login and includes time-based restrictions for enhanced security.

## Architecture

### Database Schema

The `users` table includes the following fields for temporary password management:

```sql
-- Temporary password onboarding fields
is_temporary_password BOOLEAN DEFAULT FALSE,
temp_password_expires_at TIMESTAMP,
must_change_password BOOLEAN DEFAULT FALSE,
password_changed_at TIMESTAMP,
failed_login_attempts INTEGER DEFAULT 0,
account_locked_until TIMESTAMP,
```

### Key Components

#### Backend (`/backend/src`)

1. **Utilities**
   - `utils/tempPassword.ts` - Temporary password generation and validation
   - `utils/emailTemplates.ts` - Email templates for onboarding
   - `utils/email.ts` - Email service with temporary password support

2. **Controllers**
   - `controllers/auth.controller.ts` - Login with temporary password validation
   - `controllers/user.controller.ts` - User creation with temporary passwords

3. **Validators**
   - `validators/auth.validator.ts` - Password strength validation
   - `validators/user.validator.ts` - User creation validation

4. **Routes**
   - `routes/auth.routes.ts` - Authentication endpoints
   - `routes/user.routes.ts` - User management endpoints

#### Frontend (`/admin/src`)

1. **Pages**
   - `pages/ChangePassword.tsx` - Password change interface

2. **Authentication**
   - `lib/auth.tsx` - Updated to handle forced password change

## User Creation Flow

### 1. Admin Creates User

**Endpoint:** `POST /api/users`

**Request:**
```json
{
  "email": "newuser@example.com",
  "role": "user",
  "expiryHours": 24
}
```

**Process:**
1. Validates email doesn't already exist
2. Generates cryptographically secure temporary password (16 characters)
3. Hashes password with bcrypt (12 rounds)
4. Sets temporary password flags:
   - `is_temporary_password = TRUE`
   - `must_change_password = TRUE`
   - `temp_password_expires_at = NOW() + 24 hours`
5. Sends email with temporary password
6. Logs user creation event

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "role": "user",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "message": "User created successfully. Temporary password sent to newuser@example.com"
  }
}
```

### 2. Email Delivery

The user receives an email containing:
- Temporary password (displayed prominently)
- Expiration time (24 hours by default)
- Login URL
- Security warnings
- Password requirements

**Email Features:**
- Professional HTML template with branding
- Plain text fallback
- Clear security warnings
- Password best practices

## First Login Flow

### 1. User Attempts Login

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "TemporaryPassword123!"
}
```

**Security Checks (in order):**

1. **User Exists Check**
   - Returns generic "Invalid credentials" if user not found
   - Prevents email enumeration attacks

2. **Account Lock Check**
   - Checks if `account_locked_until > NOW()`
   - Returns lock duration if locked
   - Prevents brute force attacks

3. **Temporary Password Expiration Check**
   - If `is_temporary_password = TRUE` and `temp_password_expires_at < NOW()`
   - Returns error: "Temporary password has expired"
   - User must contact administrator

4. **Password Validation**
   - Uses bcrypt constant-time comparison
   - Increments `failed_login_attempts` on failure
   - Locks account after 5 failed attempts (progressive lockout)

5. **Success Actions**
   - Resets `failed_login_attempts` to 0
   - Clears `account_locked_until`
   - Generates JWT token

**Response (Temporary Password):**
```json
{
  "success": true,
  "message": "Login successful. You must change your password before continuing.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "role": "user",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token",
    "must_change_password": true
  }
}
```

### 2. Frontend Redirects to Change Password

The frontend detects `must_change_password: true` and redirects to `/change-password` page.

### 3. User Changes Password

**Endpoint:** `POST /auth/change-password`

**Request:**
```json
{
  "currentPassword": "TemporaryPassword123!",
  "newPassword": "MyNewSecureP@ssw0rd"
}
```

**Validation:**
1. Verifies current password
2. Ensures new password is different from current
3. Validates password strength:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

**Process:**
1. Hashes new password
2. Updates database:
   - `password = hashed_new_password`
   - `is_temporary_password = FALSE`
   - `must_change_password = FALSE`
   - `temp_password_expires_at = NULL`
   - `password_changed_at = NOW()`
3. Sends confirmation email
4. User is logged out and must login with new password

## Security Features

### 1. Password Generation

**Algorithm:**
- Uses `crypto.randomBytes()` for cryptographic randomness
- 16 characters minimum
- Includes uppercase, lowercase, numbers, and special characters
- Validates complexity before returning

**Example:**
```typescript
const temporaryPassword = generateTemporaryPassword();
// Output: "aB3$xY9#mK2@pL5!"
```

### 2. Account Locking

**Progressive Lockout:**
- 5 failed attempts: 15 minutes
- 6 failed attempts: 30 minutes
- 7 failed attempts: 60 minutes
- 8+ failed attempts: 24 hours (max)

**Implementation:**
```typescript
const lockMinutes = Math.min(15 * Math.pow(2, attempts - 5), 1440);
```

### 3. Rate Limiting

**Authentication Endpoints:**
- Window: 15 minutes
- Max requests: 5
- Applied to: `/auth/login`, `/auth/register`, `/auth/change-password`

**General API:**
- Window: 15 minutes
- Max requests: 100

### 4. Password Storage

- All passwords hashed with bcrypt
- Salt rounds: 12 (configurable via `BCRYPT_ROUNDS`)
- Never store plain text passwords
- Reset tokens also hashed before storage

### 5. Email Security

- Temporary password sent only once
- Email logged for audit trail
- Development mode logs password to console
- Production requires SMTP configuration

## Edge Cases Handled

### 1. User Never Logs In

**Scenario:** Temporary password expires before first login

**Handling:**
- Login attempt returns: "Temporary password has expired"
- Admin must use "Resend Temporary Password" endpoint
- Old password is invalidated
- New expiration time is set

**Endpoint:** `POST /api/users/:id/resend-temporary-password`

### 2. Multiple Reset Requests

**Scenario:** Admin resends temporary password multiple times

**Handling:**
- Each resend invalidates previous temporary password
- Resets expiration timer
- Clears failed login attempts
- Unlocks account if locked

### 3. Email Delivery Failure

**Scenario:** Email service fails during user creation

**Handling:**
- Transaction is rolled back
- User is deleted from database
- Error returned to admin
- Admin can retry user creation

### 4. User Tries to Reuse Temporary Password

**Scenario:** User attempts to set temporary password as new password

**Handling:**
- Password comparison detects match
- Returns error: "New password must be different from current password"
- User must choose different password

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login with credentials | No |
| POST | `/auth/change-password` | Change password | Yes |
| GET | `/auth/me` | Get current user | Yes |

### User Management (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create user with temporary password |
| POST | `/api/users/:id/resend-temporary-password` | Resend temporary password |
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

## Configuration

### Environment Variables

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@olivegarden.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=1h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Testing

### Manual Testing Steps

1. **Create User:**
   ```bash
   curl -X POST http://localhost:5000/api/users \
     -H "Authorization: Bearer admin_token" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","role":"user"}'
   ```

2. **Check Email:**
   - Verify temporary password received
   - Note expiration time

3. **Login with Temporary Password:**
   ```bash
   curl -X POST http://localhost:5000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"temp_password"}'
   ```

4. **Verify Forced Password Change:**
   - Check response contains `must_change_password: true`
   - Frontend should redirect to change password page

5. **Change Password:**
   ```bash
   curl -X POST http://localhost:5000/auth/change-password \
     -H "Authorization: Bearer user_token" \
     -H "Content-Type: application/json" \
     -d '{"currentPassword":"temp_password","newPassword":"NewP@ssw0rd123"}'
   ```

6. **Verify New Login:**
   - Login with new password should succeed
   - No forced password change

### Test Cases

- ✅ User creation generates temporary password
- ✅ Email sent with temporary password
- ✅ Login with temporary password succeeds
- ✅ Login returns `must_change_password: true`
- ✅ Password change clears temporary flags
- ✅ Expired temporary password rejected
- ✅ Failed login attempts increment counter
- ✅ Account locks after 5 failed attempts
- ✅ Resend temporary password invalidates old one
- ✅ Cannot reuse temporary password as new password
- ✅ Password strength validation enforced
- ✅ Confirmation email sent after password change

## Monitoring and Logging

### Logged Events

1. **User Creation:**
   ```
   ✅ User created: user@example.com (ID: uuid)
   📧 Temporary password email sent to: user@example.com
   ```

2. **Login Attempts:**
   ```
   ❌ Failed login attempt for: user@example.com (Attempt 3/5)
   🔒 Account locked: user@example.com (Lock duration: 15 minutes)
   ✅ Successful login: user@example.com
   ```

3. **Password Changes:**
   ```
   🔑 Password changed: user@example.com
   📧 Password change confirmation sent to: user@example.com
   ```

4. **Temporary Password Resend:**
   ```
   ✅ Temporary password resent to: user@example.com (ID: uuid)
   ```

## Best Practices

### For Administrators

1. **User Creation:**
   - Use appropriate expiry time (24 hours default)
   - Verify email address before creating user
   - Inform user to check spam folder

2. **Expired Passwords:**
   - Use resend endpoint rather than creating new user
   - Monitor for users who never complete onboarding

3. **Security:**
   - Regularly review failed login attempts
   - Monitor account lockouts
   - Audit user creation events

### For Users

1. **First Login:**
   - Change password immediately
   - Use strong, unique password
   - Don't reuse passwords from other services

2. **Password Requirements:**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, special characters
   - Avoid common words or personal information

## Troubleshooting

### Issue: Email Not Received

**Solutions:**
1. Check spam/junk folder
2. Verify email configuration in `.env`
3. Check server logs for email errors
4. In development, check console for temporary password

### Issue: Temporary Password Expired

**Solution:**
- Admin uses resend temporary password endpoint
- New password sent with fresh expiration

### Issue: Account Locked

**Solution:**
- Wait for lock duration to expire
- Admin can resend temporary password (clears lock)

### Issue: Cannot Change Password

**Possible Causes:**
1. Current password incorrect
2. New password doesn't meet requirements
3. New password same as current password

**Solution:**
- Verify current password
- Check password requirements
- Choose different password

## Future Enhancements

1. **Two-Factor Authentication (2FA)**
   - Add TOTP support
   - SMS verification option

2. **Password History**
   - Prevent reuse of last N passwords
   - Store hashed password history

3. **Configurable Password Policies**
   - Admin-defined password requirements
   - Custom expiration times per role

4. **Audit Trail**
   - Detailed authentication logs
   - Password change history
   - Export audit reports

5. **Self-Service Password Reset**
   - Allow users to request password reset
   - Email verification flow

## Conclusion

This temporary password onboarding system provides a secure, production-ready solution for user onboarding with the following key benefits:

- ✅ Secure password generation
- ✅ Time-based expiration
- ✅ Forced password change on first login
- ✅ Account locking for brute force protection
- ✅ Comprehensive logging and monitoring
- ✅ Email notifications
- ✅ Edge case handling
- ✅ Easy to maintain and extend

The system follows security best practices and provides a smooth user experience while maintaining high security standards.
