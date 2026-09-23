import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, assertOk } from '../db/index.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

const DEFAULT_CATEGORIES = [
  { name: 'Food', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'University', type: 'expense' },
  { name: 'Home', type: 'expense' },
  { name: 'Internet & Phone', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Other', type: 'expense' },
  { name: 'Family Support', type: 'received' },
  { name: 'Gift', type: 'received' },
  { name: 'Other Received', type: 'received' },
];

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    currency: row.currency,
    theme: row.theme,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({
        error: 'Name, email, and password (min 6 chars) are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { data: existing, error: findErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();
    assertOk(findErr);

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const { data: user, error: userErr } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        password_hash,
      })
      .select('*')
      .single();
    assertOk(userErr, 'Failed to create user');

    const categories = DEFAULT_CATEGORIES.map((cat) => ({
      user_id: user.id,
      name: cat.name,
      type: cat.type,
    }));
    const { error: catErr } = await supabase.from('categories').insert(categories);
    assertOk(catErr, 'Failed to seed categories');

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    assertOk(error);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();
    assertOk(error);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load user' });
  }
});

router.put('/password', authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: 'Valid current and new password required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    assertOk(error);

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const { error: updErr } = await supabase
      .from('users')
      .update({ password_hash: bcrypt.hashSync(newPassword, 10) })
      .eq('id', req.user.id);
    assertOk(updErr);

    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Password update failed' });
  }
});

export default router;
