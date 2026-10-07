import { Router } from 'express';
import { getMany, getOne, query } from '../db/index.js';
import { authRequired } from '../middleware/auth.js';
import { getTransactionsWithBalance } from '../services/transactions.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  try {
    const user = await getOne('SELECT * FROM users WHERE id = $1', [
      req.user.id,
    ]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const categories = await getMany(
      `SELECT * FROM categories
       WHERE user_id = $1
       ORDER BY type ASC, name ASC`,
      [req.user.id]
    );

    res.json({
      profile: {
        name: user.name,
        email: user.email,
        currency: user.currency,
        theme: user.theme,
      },
      categories,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load settings' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, email, currency, theme } = req.body;
    const user = await getOne('SELECT * FROM users WHERE id = $1', [
      req.user.id,
    ]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await getOne(
      `UPDATE users SET
        name = $1,
        email = $2,
        currency = $3,
        theme = $4
       WHERE id = $5
       RETURNING *`,
      [
        name?.trim() || user.name,
        email?.toLowerCase().trim() || user.email,
        currency || user.currency,
        theme || user.theme,
        req.user.id,
      ]
    );

    res.json({
      profile: {
        name: updated.name,
        email: updated.email,
        currency: updated.currency,
        theme: updated.theme,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, type = 'expense' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });

    const category = await getOne(
      `INSERT INTO categories (user_id, name, type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, name.trim(), type]
    );

    res.status(201).json({ category });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: err.message || 'Failed to create category' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const deleted = await getOne(
      `DELETE FROM categories
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete category' });
  }
});

router.get('/export', async (req, res) => {
  try {
    const transactions = await getTransactionsWithBalance(req.user.id, {
      newestFirst: false,
    });
    res.json({
      exportedAt: new Date().toISOString(),
      transactions: transactions.map(({ balance_after, ...tx }) => tx),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Export failed' });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ error: 'transactions array required' });
    }

    const rows = transactions.filter(
      (tx) => tx.type && tx.amount && tx.category && tx.date && tx.time
    );

    for (const tx of rows) {
      await query(
        `INSERT INTO transactions
          (user_id, type, amount, category, description, received_from, note, date, time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          req.user.id,
          tx.type,
          Number(tx.amount),
          tx.category,
          tx.description || '',
          tx.received_from || tx.receivedFrom || null,
          tx.note || '',
          tx.date,
          tx.time,
        ]
      );
    }

    res.json({
      message: 'Imported',
      transactions: await getTransactionsWithBalance(req.user.id),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Import failed' });
  }
});

export default router;
