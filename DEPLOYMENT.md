# Olive Garden deployment

## Required services

- Node.js 18 or newer
- PostgreSQL
- Redis 6 or newer (**optional** — see below)

Copy `backend/.env.example` to `backend/.env` and set the database, JWT, Redis, CORS, and email values. In production, use HTTPS and set `NODE_ENV=production`; auth cookies will then include the `Secure` flag.

## Redis dual-mode

Redis is optional. Token rotation, sessions, CSRF, and rate limiting all work on an in-memory store when Redis is unavailable (e.g. cPanel shared hosting):

- `REDIS_URL` unset → in-memory store (single-process deployments only, such as Passenger/Node.js App Manager)
- `REDIS_URL=redis://…` → real Redis
- `REDIS_MODE=memory` forces the in-memory store even when `REDIS_URL` is set

## Deployment order

1. Install dependencies in `backend`, `admin`, **and `frontend`** (the public site is a third app and must be built and served too).
2. Create the database schema and first admin with `npm run db:setup` from `backend`. This applies `schema.sql`, `extended-schema.sql`, `notifications-schema.sql` and `audit-schema.sql` in order, then creates the first admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` (a random password is printed once if `ADMIN_PASSWORD` is unset) with a forced password change. **No default credential is shipped.**
3. Apply database migrations with `npm run migrate` from `backend` (creates sessions, MFA fields, uploads, audit detail, inquiry replies, indexes).
4. Build all applications with `npm run build` (backend has no build step; build `admin` and `frontend`).
5. Start the backend with `npm start` and serve the admin `dist` directory and the frontend `dist` directory from their hosts.

If you deployed before this change: the repository no longer contains the former `Admin123!` seed. Run `RESET_EMAIL=admin@example.com node scripts/fix-password.js --temporary` to rotate that account — or delete it and create a new admin with `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:setup` (note: `db:setup` recreates the schema and is destructive; on production use `fix-password.js`).

Migrations are tracked in the `migrations` table and are applied once, in numeric filename order. Take a database backup before applying migrations. To roll back, restore the backup or apply a reviewed down migration; this project intentionally does not delete production data automatically.

## Security checklist

- Use a unique JWT secret of at least 32 characters.
- Keep Redis and PostgreSQL on private networks.
- Configure `ALLOWED_ORIGINS` to the exact admin/public origins.
- Ensure the upload directory is not directly writable by the web server process beyond the application requirement.
- Verify `Strict-Transport-Security`, CSP, CSRF, and rate-limit headers after deployment.
