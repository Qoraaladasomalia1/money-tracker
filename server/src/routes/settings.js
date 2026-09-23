import { Router } from 'express';
import { supabase, assertOk } from '../db/index.js';
import { authRequired } from '../middleware/auth.js';
import { getTransactionsWithBalance } from '../services/transactions.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    assertOk(userErr);

    const { data: categories, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', req.user.id)
      .order('type')
      .order('name');
    assertOk(catErr);

    res.json({
      profile: {
        name: user.name,
        email: user.email,
        currency: user.currency,
        theme: user.theme,
      },
      categories: categories || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load settings' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, email, currency, theme } = req.body;
    const { data: user, error: findErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    assertOk(findErr);

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        name: name?.trim() || user.name,
        email: email?.toLowerCase().trim() || user.email,
        currency: currency || user.currency,
        theme: theme || user.theme,
      })
      .eq('id', req.user.id)
      .select('*')
      .single();
    assertOk(error);

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

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: req.user.id,
        name: name.trim(),
        type,
      })
      .select('*')
      .single();
    assertOk(error, 'Failed to create category');

    res.status(201).json({ category });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create category' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');
    assertOk(error);

    if (!data?.length) {
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

    const rows = transactions
      .filter((tx) => tx.type && tx.amount && tx.category && tx.date && tx.time)
      .map((tx) => ({
        user_id: req.user.id,
        type: tx.type,
        amount: Number(tx.amount),
        category: tx.category,
        description: tx.description || '',
        received_from: tx.received_from || tx.receivedFrom || null,
        note: tx.note || '',
        date: tx.date,
        time: tx.time,
      }));

    if (rows.length) {
      const { error } = await supabase.from('transactions').insert(rows);
      assertOk(error, 'Import failed');
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
