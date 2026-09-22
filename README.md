# MoneyTrack

Personal money tracking web app — React + Express + **Supabase (Postgres)**.

## Setup

### 1. Supabase database

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql)
3. Copy **Project URL** and **service_role** key from **Project Settings → API**

### 2. Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
SUPABASE_URL=https://YOUR_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=change-me
```

### 3. Install & run

```bash
npm install
cd server && npm install && cd ../client && npm install && cd ..

npm run seed   # optional demo user
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:4000  

**Demo:** `alex@moneytrack.app` / `password123`

## Stack

- Frontend: React, Vite, Tailwind
- Backend: Node.js, Express, JWT
- Database: Supabase Postgres

## Features

Dashboard, transactions, add/edit/delete, reports with month groups, PDF + letter image export, settings.
