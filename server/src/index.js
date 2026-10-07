import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDbWithRetry } from './db/index.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import summaryRoutes from './routes/summary.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';

let dbReady = false;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Always 200 once the process is listening (Docker/Coolify healthcheck).
// `db` shows whether PostgreSQL is connected yet.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: dbReady });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api', summaryRoutes);
app.use('/api/settings', settingsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  // Listen first so Docker/Coolify healthchecks can reach the process
  await new Promise((resolve) => {
    app.listen(PORT, HOST, () => {
      console.log(`MoneyTrack API listening on http://${HOST}:${PORT}`);
      resolve();
    });
  });

  await connectDbWithRetry();
  dbReady = true;
  console.log('MoneyTrack API ready');
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
