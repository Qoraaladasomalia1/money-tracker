# MoneyTrack + Supabase

## 1. Create tables

1. Open your Supabase project
2. Go to **SQL Editor** → **New query**
3. Paste and run the full file: [`supabase/schema.sql`](../supabase/schema.sql)

## 2. Connect the API

Copy keys from **Supabase → Project Settings → API**:

| Env var | Value |
|---------|--------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` secret (server only — never expose in the browser) |

Put them in `server/.env`:

```env
PORT=4000
JWT_SECRET=any-long-random-string
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

## 3. Seed demo data (optional)

```bash
cd server
npm run seed
```

Demo login: `alex@moneytrack.app` / `password123`

## 4. Run the app

```bash
npm run dev
```

## Schema overview

```
users
  id (uuid), name, email, password_hash, currency, theme, created_at

categories
  id (uuid), user_id → users, name, type (expense|received)

transactions
  id (uuid), user_id → users, type (received|expense), amount,
  category, description, received_from, note, date, time,
  created_at, updated_at
```

Auth stays in Express (JWT + bcrypt). Supabase stores the data.
The API uses the **service role** key so it can read/write securely from the server.
