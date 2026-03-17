# Olive Garden Admin API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@olivegarden.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@olivegarden.com",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### GET /auth/me
Get current authenticated user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@olivegarden.com",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Users Endpoints

### GET /users
Get all users with optional filters. **Admin only**

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `role` (optional): Filter by role (admin, moderator, user)
- `search` (optional): Search by email

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "total": 10
  }
}
```

### GET /users/:id
Get user by ID. **Admin only**

**Headers:** `Authorization: Bearer <token>`

### POST /users
Create new user. **Admin only**

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "role": "user"
}
```

### PUT /users/:id
Update user. **Admin only**

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "password": "NewPassword123!",
  "role": "moderator"
}
```

### DELETE /users/:id
Delete user. **Admin only**

**Headers:** `Authorization: Bearer <token>`

### GET /users/stats/summary
Get user statistics. **Admin only**

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 50,
    "role_breakdown": [
      { "role": "admin", "count": "5" },
      { "role": "moderator", "count": "10" },
      { "role": "user", "count": "35" }
    ],
    "recent_users": 12
  }
}
```

---

## Bookings Endpoints

### GET /bookings
Get all bookings with optional filters. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): pending, confirmed, cancelled, completed
- `venue` (optional): Main Arena, Garden Hall, Therapy Room, Conference Room
- `event_type` (optional): Wedding, Corporate, Workshop, Session, Conference, Party, Other
- `payment_status` (optional): unpaid, partial, paid, refunded
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD
- `search` (optional): Search by client name, event name, or booking reference

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [...],
    "total": 25
  }
}
```

### GET /bookings/:id
Get booking by ID. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

### GET /bookings/reference/:reference
Get booking by reference number. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

### POST /bookings
Create new booking. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "+254712345678",
  "event_name": "Wedding Reception",
  "event_type": "Wedding",
  "venue": "Main Arena",
  "event_date": "2024-06-15",
  "start_time": "14:00",
  "end_time": "22:00",
  "total_amount": 500000,
  "deposit_amount": 200000,
  "guest_count": 300,
  "special_requests": "Need floral decorations"
}
```

### PUT /bookings/:id
Update booking. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "confirmed",
  "payment_status": "paid",
  "notes": "Payment received in full"
}
```

### DELETE /bookings/:id
Delete booking. **Admin only**

**Headers:** `Authorization: Bearer <token>`

### GET /bookings/stats/summary
Get booking statistics. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_bookings": 142,
    "total_revenue": 45000000,
    "pending_bookings": 15,
    "confirmed_bookings": 85,
    "status_breakdown": [...],
    "venue_breakdown": [...],
    "event_type_breakdown": [...],
    "payment_status_breakdown": [...]
  }
}
```

---

## Gallery Endpoints

### GET /gallery
Get all gallery images with optional filters. **Public (published only) / Authenticated (all)**

**Query Parameters:**
- `album` (optional): Main Arena, Garden Hall, Therapy Room, Events, Facilities, Other
- `category` (optional): Filter by category
- `is_featured` (optional): true/false
- `is_published` (optional): true/false (admin only)
- `search` (optional): Search by title or description

**Response:**
```json
{
  "success": true,
  "data": {
    "images": [...],
    "total": 50
  }
}
```

### GET /gallery/:id
Get image by ID. **Public (if published) / Authenticated (all)**

### GET /gallery/album/:album
Get images by album. **Public (published only) / Authenticated (all)**

### POST /gallery
Create new gallery image. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Beautiful Wedding Setup",
  "description": "Main Arena decorated for a wedding",
  "url": "https://example.com/image.jpg",
  "thumbnail_url": "https://example.com/thumb.jpg",
  "album": "Main Arena",
  "category": "Weddings",
  "tags": ["wedding", "decoration", "arena"],
  "is_featured": true,
  "is_published": true
}
```

### PUT /gallery/:id
Update gallery image. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

### DELETE /gallery/:id
Delete gallery image. **Admin only**

**Headers:** `Authorization: Bearer <token>`

### PATCH /gallery/:id/featured
Toggle featured status. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

### PATCH /gallery/:id/publish
Toggle published status. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

### GET /gallery/stats/summary
Get gallery statistics. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_images": 120,
    "published_images": 100,
    "featured_images": 15,
    "album_breakdown": [...],
    "total_storage_bytes": 524288000
  }
}
```

---

## Analytics Endpoints

### POST /analytics/track
Track analytics event. **Authenticated users**

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "event_type": "page_view",
  "event_category": "engagement",
  "event_action": "view",
  "event_label": "Dashboard Page",
  "page_url": "/admin/dashboard",
  "page_title": "Dashboard"
}
```

### GET /analytics/overview
Get analytics overview. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": {
    "total_bookings": 142,
    "total_revenue": 45000000,
    "total_users": 50,
    "total_events": 1250
  }
}
```

### GET /analytics/revenue
Get revenue analytics. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue_by_month": [...],
    "revenue_by_venue": [...],
    "revenue_by_event_type": [...]
  }
}
```

### GET /analytics/bookings/trends
Get booking trends. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "daily_bookings": [...],
    "bookings_by_status": [...],
    "bookings_by_venue": [...],
    "bookings_by_event_type": [...]
  }
}
```

### GET /analytics/engagement
Get user engagement analytics. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "events_by_type": [...],
    "events_by_category": [...],
    "top_pages": [...]
  }
}
```

### GET /analytics/dashboard
Get dashboard metrics. **Admin/Moderator only**

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "current_month": {
      "bookings": 25,
      "revenue": 8500000
    },
    "last_month": {
      "bookings": 20,
      "revenue": 7200000
    },
    "growth": {
      "bookings": 25.0,
      "revenue": 18.1
    },
    "upcoming_bookings": 45,
    "pending_bookings": 12
  }
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message here",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Security Features

1. **JWT Authentication** - Secure token-based authentication
2. **Role-Based Access Control** - Admin, Moderator, and User roles
3. **Password Hashing** - bcrypt with 12 rounds
4. **Rate Limiting** - Protection against brute force attacks
5. **CORS** - Configured for allowed origins
6. **Helmet** - Security headers (XSS, clickjacking protection)
7. **Input Validation** - Request validation middleware
8. **SQL Injection Protection** - Parameterized queries

---

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password` (TEXT, Hashed)
- `role` (VARCHAR: user, admin, moderator)
- `created_at`, `updated_at` (TIMESTAMP)

### Bookings Table
- `id` (UUID, Primary Key)
- `booking_reference` (VARCHAR, Unique)
- Client information (name, email, phone)
- Event details (name, type, venue, date, time)
- Pricing (total, deposit, balance)
- Status fields (status, payment_status)
- `created_by` (UUID, Foreign Key to users)
- `created_at`, `updated_at` (TIMESTAMP)

### Gallery Images Table
- `id` (UUID, Primary Key)
- `title`, `description`, `url`, `thumbnail_url`
- `album`, `category`, `tags`
- File metadata (size, type, dimensions)
- `is_featured`, `is_published` (BOOLEAN)
- `uploaded_by` (UUID, Foreign Key to users)
- `created_at`, `updated_at` (TIMESTAMP)

### Analytics Events Table
- `id` (UUID, Primary Key)
- Event details (type, category, action, label)
- `event_data` (JSONB)
- User context (user_id, session_id, ip_address)
- Page context (url, title, referrer)
- Metrics (value, duration)
- `created_at` (TIMESTAMP)

---

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run Database Migrations**
   ```bash
   # Create base schema
   node scripts/setup-database.js
   
   # Add extended tables
   node scripts/migrate-extended-schema.js
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Test APIs**
   ```bash
   node scripts/test-apis.js
   ```

---

## Default Admin Credentials

**Email:** admin@olivegarden.com  
**Password:** Admin123!

⚠️ **Important:** Change the default password in production!
