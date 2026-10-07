# MoneyTrack

Personal money tracking web app — React + Express + **local PostgreSQL**.

## Setup

### 1. PostgreSQL

Create a database named `moneytrack` (or match `DB_NAME` in `server/.env`):

```sql
CREATE DATABASE moneytrack;
```

Schema is applied automatically when the API starts (`server/db/schema.sql`).

### 2. Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
JWT_SECRET=change-me
DB_HOST=localhost
DB_PORT=5432
DB_NAME=moneytrack
DB_USER=postgres
DB_PASSWORD=your-postgres-password
```

### 3. Install & run

```bash
cd server
npm install
npm run seed   # optional demo user
npm run dev

# other terminal
cd client
npm install
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:4000  

**Demo:** `alex@moneytrack.app` / `password123`

### Docker

```bash
docker compose up -d --build
# or development:
docker compose -f docker-compose.dev.yml up --build
```

## Stack

- Frontend: React, Vite, Tailwind
- Backend: Node.js, Express, JWT
- Database: PostgreSQL (local / Docker)

## Features

Dashboard, transactions, add/edit/delete, reports with month groups, PDF + letter image export, settings.
