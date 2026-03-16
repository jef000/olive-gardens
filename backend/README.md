# Olive Garden Gateway - Backend API (PostgreSQL)

Production-ready Node.js backend API built with Express, TypeScript, and PostgreSQL using native `pg` driver.

## 🚀 Features

- **TypeScript** - Full type safety and modern JavaScript features
- **Express.js** - Fast, unopinionated web framework
- **PostgreSQL** - Robust relational database with connection pooling
- **Native pg Driver** - Direct PostgreSQL access without ORM overhead
- **JWT Authentication** - Secure token-based authentication
- **Password Reset Flow** - Complete forgot/reset password implementation
- **Security Best Practices**:
  - Helmet for secure HTTP headers
  - CORS with configurable origins
  - Rate limiting to prevent abuse
  - Input validation with Zod
  - Password hashing with bcrypt
  - Secure reset token generation with crypto
  - Email enumeration prevention
- **Performance Optimizations**:
  - PostgreSQL connection pooling
  - Response compression
  - Request logging
- **Code Quality**:
  - ESLint + Prettier
  - Consistent code formatting
  - Centralized error handling

## 📁 Project Structure

```
backend-pg/
├── database/
│   └── schema.sql             # PostgreSQL database schema
├── src/
│   ├── config/
│   │   └── env.ts             # Environment configuration
│   ├── controllers/
│   │   └── auth.controller.ts # Authentication logic
│   ├── db/
│   │   └── pool.ts            # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── auth.middleware.ts # JWT authentication
│   │   ├── errorHandler.ts    # Global error handling
│   │   ├── rateLimiter.ts     # Rate limiting
│   │   └── validate.ts        # Request validation
│   ├── routes/
│   │   ├── auth.routes.ts     # Auth endpoints
│   │   ├── user.routes.ts     # User endpoints
│   │   └── index.ts           # Route aggregation
│   ├── types/
│   │   ├── express.d.ts       # Express type extensions
│   │   └── user.ts            # User types
│   ├── utils/
│   │   ├── crypto.ts          # Reset token generation
│   │   ├── email.ts           # Email service
│   │   ├── jwt.ts             # JWT utilities
│   │   ├── password.ts        # Password hashing
│   │   └── response.ts        # API responses
│   ├── validators/
│   │   └── auth.validator.ts  # Zod validation schemas
│   └── server.ts              # Application entry point
├── .env.example               # Environment variables template
├── .eslintrc.json             # ESLint configuration
├── .prettierrc                # Prettier configuration
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend-pg
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - Database credentials (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
   - JWT_SECRET - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Email settings (optional for development)
   - ALLOWED_ORIGINS - Your frontend URL(s)

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb olive_garden_db
   
   # Run schema
   psql -d olive_garden_db -f database/schema.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

## 🔐 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout user | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |

### Users (Protected)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/users` | Get all users | Yes | admin |
| GET | `/api/users/:id` | Get user by ID | Yes | admin |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health status |

## 📤 Request/Response Examples

### Register User

**Request:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Login

**Request:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Forgot Password

**Request:**
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Security Note:** Response is the same whether email exists or not to prevent email enumeration.

### Reset Password

**Request:**
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Protected Route (with JWT)

**Request:**
```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### JWT Tokens
- Access Token: 1 hour expiry (configurable)
- Signed with HS256 algorithm
- Includes user ID, email, and role

### Password Reset Flow

1. **Forgot Password**:
   - User requests reset with email
   - System generates cryptographically secure random token (32 bytes)
   - Token is hashed with bcrypt before storing in database
   - Plain token sent via email (only time it's transmitted)
   - Token expires in 1 hour
   - Response doesn't reveal if email exists

2. **Reset Password**:
   - User submits token and new password
   - System hashes provided token and compares with database
   - Verifies token hasn't expired
   - Updates password (hashed with bcrypt)
   - Clears reset token from database
   - User must login with new password

### Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

### HTTP Security Headers (via Helmet)
- XSS Protection
- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- Clickjacking protection

## 🗄️ Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  reset_token TEXT,
  reset_token_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📧 Email Configuration

### Development (Mock Email)
If email credentials are not configured, the system will log reset links to console:

```
⚠️  Email credentials not configured. Using mock email service.
🔗 Development reset link: http://localhost:3000/reset-password?token=abc123...
```

### Production (Real SMTP)
Configure these environment variables:
- `EMAIL_HOST` - SMTP server (e.g., smtp.gmail.com)
- `EMAIL_PORT` - SMTP port (587 for TLS)
- `EMAIL_USER` - Email account
- `EMAIL_PASSWORD` - Email password or app-specific password
- `EMAIL_FROM` - Sender email address

## 🚀 Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment to production**
   ```bash
   export NODE_ENV=production
   ```

3. **Set up production database**
   ```bash
   psql -d production_db -f database/schema.sql
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Environment Variables for Production

- Set `NODE_ENV=production`
- Use strong, unique JWT_SECRET (min 32 characters)
- Configure `ALLOWED_ORIGINS` with your production frontend URL
- Use a production PostgreSQL database with SSL
- Configure real SMTP credentials for email
- Set appropriate rate limits

## 📊 Monitoring & Logging

- HTTP requests logged via Morgan
- Errors logged with stack traces (development only)
- Database queries logged (development only)
- Graceful shutdown handling

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d olive_garden_db

# Check if database exists
psql -l
```

### Email Not Sending
- Check EMAIL_* environment variables
- For Gmail, use app-specific password
- Check console for development reset links

## 📄 License

MIT
