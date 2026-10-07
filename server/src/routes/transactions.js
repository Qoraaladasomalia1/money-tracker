import { Router } from 'express';
import { getOne, query } from '../db/index.js';
import { authRequired } from '../middleware/auth.js';
import {
  getTransactionsWithBalance,
  getSummary,
} from '../services/transactions.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  try {
    const { type, category, search, from, to } = req.query;
    let txs = await getTransactionsWithBalance(req.user.id);

    if (type === 'received' || type === 'expense') {
      txs = txs.filter((t) => t.type === type);
    }
    if (category) {
      txs = txs.filter((t) => t.category === category);
    }
    if (from) txs = txs.filter((t) => t.date >= from);
    if (to) txs = txs.filter((t) => t.date <= to);
    if (search) {
      const q = String(search).toLowerCase();
      txs = txs.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.received_from?.toLowerCase().includes(q) ||
          t.note?.toLowerCase().includes(q)
      );
    }

    res.json({
      transactions: txs,
      summary: await getSummary(req.user.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to load transactions' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const txs = await getTransactionsWithBalance(req.user.id, {
      newestFirst: false,
    });
    const tx = txs.find((t) => t.id === req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ transaction: tx });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load transaction' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description = '',
      receivedFrom,
      note = '',
      date,
      time,
    } = req.body;

    if (!type || !['received', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be received or expense' });
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    if (!category?.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    const created = await getOne(
      `INSERT INTO transactions
        (user_id, type, amount, category, description, received_from, note, date, time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.id,
        type,
        numAmount,
        category.trim(),
        description.trim(),
        type === 'received' ? (receivedFrom || '').trim() : null,
        note.trim(),
        date,
        time,
      ]
    );

    const txs = await getTransactionsWithBalance(req.user.id, {
      newestFirst: false,
    });
    const transaction = txs.find((t) => t.id === created.id);
    res.status(201).json({
      transaction,
      summary: await getSummary(req.user.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to save transaction' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await getOne(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const {
      type = existing.type,
      amount = existing.amount,
      category = existing.category,
      description = existing.description,
      receivedFrom = existing.received_from,
      note = existing.note,
      date = existing.date,
      time = existing.time,
    } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const dateVal =
      date instanceof Date ? date.toISOString().slice(0, 10) : date;
    const timeVal = String(time).slice(0, 5);

    await query(
      `UPDATE transactions SET
        type = $1,
        amount = $2,
        category = $3,
        description = $4,
        received_from = $5,
        note = $6,
        date = $7,
        time = $8
       WHERE id = $9 AND user_id = $10`,
      [
        type,
        numAmount,
        category,
        description,
        type === 'received' ? receivedFrom : null,
        note,
        dateVal,
        timeVal,
        req.params.id,
        req.user.id,
      ]
    );

    const txs = await getTransactionsWithBalance(req.user.id, {
      newestFirst: false,
    });
    const transaction = txs.find((t) => t.id === req.params.id);
    res.json({
      transaction,
      summary: await getSummary(req.user.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to update transaction' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await getOne(
      `DELETE FROM transactions
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      message: 'Deleted',
      summary: await getSummary(req.user.id),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete transaction' });
  }
});

export default router;
