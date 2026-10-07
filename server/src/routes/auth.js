import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getOne, query } from '../db/index.js';
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
    const existing = await getOne('SELECT id FROM users WHERE email = $1', [
      normalizedEmail,
    ]);

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const user = await getOne(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), normalizedEmail, password_hash]
    );

    for (const cat of DEFAULT_CATEGORIES) {
      await query(
        `INSERT INTO categories (user_id, name, type)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, name, type) DO NOTHING`,
        [user.id, cat.name, cat.type]
      );
    }

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

    const user = await getOne('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase().trim(),
    ]);

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
    const user = await getOne('SELECT * FROM users WHERE id = $1', [
      req.user.id,
    ]);
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

    const user = await getOne('SELECT * FROM users WHERE id = $1', [
      req.user.id,
    ]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      bcrypt.hashSync(newPassword, 10),
      req.user.id,
    ]);

    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Password update failed' });
  }
});

export default router;
