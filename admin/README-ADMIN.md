# Olive Garden Admin Dashboard

Production-ready admin dashboard for managing the Olive Garden event venue system.

## 🚀 Features

- **User Management** - View, create, edit, and manage users with role-based access control
- **Booking Management** - Manage venue bookings, approvals, and availability
- **Analytics Dashboard** - View key metrics, charts, and statistics
- **Gallery Management** - Upload and manage venue images
- **Secure Authentication** - JWT-based authentication with admin role verification
- **Responsive Design** - Modern UI built with TailwindCSS and shadcn/ui

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Running backend API (see `../backend/` folder)

## 🛠️ Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the dashboard**
   Open http://localhost:5173 in your browser

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🔐 Login Credentials

Use admin credentials from your backend database. Default seeded admin:
- Email: `admin@olivegarden.com`
- Password: `Admin123!`

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Sidebar, Header
│   │   └── ProtectedRoute.tsx
│   ├── lib/
│   │   ├── api.ts           # Axios API client
│   │   ├── auth.tsx         # Auth context & hooks
│   │   └── utils.ts         # Utility functions
│   ├── pages/
│   │   ├── Login.tsx        # Login page
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   └── [other pages]    # Coming soon
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── App.tsx              # Main app with routing
│   └── main.tsx             # Entry point
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🎨 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Data fetching & caching
- **Axios** - HTTP client
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons

## 🔒 Security Features

- JWT token authentication
- Role-based access control (admin/moderator only)
- Protected routes
- Automatic token refresh
- CORS configuration

## 🚧 Development Status

### ✅ Completed
- Project setup and configuration
- Authentication system
- Protected routing
- Dashboard layout (Sidebar, Header)
- Login page
- Dashboard overview page

### 🔄 Coming Soon
- User management module
- Booking management module
- Analytics & reporting
- Gallery management

## 📡 API Integration

The dashboard connects to the backend API at `VITE_API_URL`. Ensure the backend is running before starting the dashboard.

### API Endpoints Used
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/users` - List users (admin)

## 🐛 Troubleshooting

### Dependencies not found
Run `npm install` to install all required packages.

### API connection errors
- Ensure backend is running on the configured port
- Check `VITE_API_URL` in `.env` file
- Verify CORS is configured in backend to allow dashboard origin

## 📄 License

MIT
