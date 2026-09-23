import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { getSummary, getReport } from '../services/transactions.js';

const router = Router();
router.use(authRequired);

router.get('/summary', async (req, res) => {
  try {
    res.json(await getSummary(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load summary' });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const { from, to, period, type = 'all' } = req.query;
    const today = new Date();
    let rangeFrom = from ? String(from) : undefined;
    let rangeTo = to ? String(to) : today.toISOString().slice(0, 10);

    if (!from && period) {
      const d = new Date(today);
      if (period === 'all') {
        rangeFrom = undefined;
        rangeTo = undefined;
      } else if (period === 'daily') {
        rangeFrom = rangeTo;
      } else if (period === 'weekly') {
        d.setDate(d.getDate() - 6);
        rangeFrom = d.toISOString().slice(0, 10);
      } else if (period === 'monthly') {
        d.setDate(1);
        rangeFrom = d.toISOString().slice(0, 10);
      }
    }

    res.json(
      await getReport(req.user.id, {
        from: rangeFrom,
        to: rangeTo,
        type: String(type),
      })
    );
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({
      error: err.message || 'Failed to generate report',
    });
  }
});

export default router;
