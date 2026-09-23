import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import summaryRoutes from './routes/summary.js';
import settingsRoutes from './routes/settings.js';
import './db/index.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api', summaryRoutes);
app.use('/api/settings', settingsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`MoneyTrack API running on http://localhost:${PORT}`);
});
