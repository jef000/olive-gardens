# Admin Dashboard Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd admin-dashboard
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Backend (Required)
In a separate terminal:
```bash
cd ../backend
npm install
npm run dev
```

### 4. Start Admin Dashboard
```bash
npm run dev
```

### 5. Access Dashboard
Open http://localhost:5173/login

**Default Admin Credentials:**
- Email: `admin@olivegarden.com`
- Password: `Admin123!`

## Features Implemented

### ✅ Authentication
- JWT-based login
- Role-based access (admin/moderator only)
- Protected routes
- Auto token refresh

### ✅ User Management
- View all users in data table
- Search and filter users
- Create new users with roles
- Edit user roles
- Delete users
- Role badges (admin, moderator, user)

### ✅ Booking Management
- View all bookings
- Filter by status (pending, confirmed, completed, cancelled)
- Search bookings
- Status badges with colors
- Booking statistics

### ✅ Analytics Dashboard
- Key metrics cards
- Revenue overview
- Booking trends
- Top performing venues
- Chart placeholders (ready for Recharts integration)

### ✅ Gallery Management
- Image grid with albums
- Filter by album
- Upload button (ready for implementation)
- Storage usage tracking
- Album statistics
- Delete images

### ✅ Main Dashboard
- Overview statistics
- Recent bookings
- Recent users
- Quick metrics

## Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   └── table.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx  # Navigation sidebar
│   │   │   └── Header.tsx   # Top header
│   │   └── ProtectedRoute.tsx
│   ├── lib/
│   │   ├── api.ts           # Axios client
│   │   ├── auth.tsx         # Auth context
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Login.tsx        # ✅ Complete
│   │   ├── Dashboard.tsx    # ✅ Complete
│   │   ├── Users.tsx        # ✅ Complete
│   │   ├── Bookings.tsx     # ✅ Complete
│   │   ├── Analytics.tsx    # ✅ Complete
│   │   └── Gallery.tsx      # ✅ Complete
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
```

## API Endpoints Used

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List all users (admin)
- `POST /api/auth/register` - Create user
- `DELETE /api/users/:id` - Delete user

### Bookings (To be implemented in backend)
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

### Gallery (To be implemented in backend)
- `GET /api/gallery` - List images
- `POST /api/gallery` - Upload image
- `DELETE /api/gallery/:id` - Delete image

## Next Steps

### Backend Extensions Needed

1. **Bookings Table**
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  venue_id VARCHAR(50),
  booking_date DATE,
  status VARCHAR(20),
  guests INTEGER,
  total_amount DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

2. **Gallery Table**
```sql
CREATE TABLE gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT,
  album VARCHAR(50),
  caption TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

3. **Backend Controllers**
- Create `bookings.controller.ts`
- Create `gallery.controller.ts`
- Add routes to `src/routes/index.ts`

## Troubleshooting

### TypeScript Errors
All TypeScript errors will resolve after running `npm install`.

### API Connection Failed
- Ensure backend is running on port 5000
- Check CORS settings in backend allow `http://localhost:5173`
- Verify `.env` file has correct `VITE_API_URL`

### Login Failed
- Check backend database has admin user
- Run backend database migrations
- Verify JWT_SECRET is set in backend `.env`

## Development Tips

### Adding New Pages
1. Create page component in `src/pages/`
2. Import in `src/App.tsx`
3. Add route in `App.tsx`
4. Add navigation link in `Sidebar.tsx`

### Adding New API Calls
1. Use `api` instance from `src/lib/api.ts`
2. Wrap in `useQuery` or `useMutation` from TanStack Query
3. Handle loading and error states

### Styling
- Use Tailwind utility classes
- Use shadcn/ui components for consistency
- Follow existing color scheme (gray-900 for text, blue for primary)

## Production Deployment

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

### Deploy
- Build output is in `dist/`
- Deploy to Netlify, Vercel, or any static hosting
- Set environment variable `VITE_API_URL` to production API URL
