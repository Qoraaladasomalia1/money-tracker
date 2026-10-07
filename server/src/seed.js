import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDb, getOne, query } from './db/index.js';

const email = 'alex@moneytrack.app';

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

const sampleTxs = [
  {
    type: 'received',
    amount: 50,
    category: 'Family Support',
    description: 'Money from Father',
    received_from: 'Father',
    note: 'Monthly expenses',
    date: '2026-09-21',
    time: '09:30',
  },
  {
    type: 'received',
    amount: 20,
    category: 'Family Support',
    description: 'Money from Mother',
    received_from: 'Mother',
    note: 'Extra support',
    date: '2026-09-20',
    time: '14:00',
  },
  {
    type: 'expense',
    amount: 5,
    category: 'Transport',
    description: 'Taxi to University',
    note: '',
    date: '2026-09-21',
    time: '10:15',
  },
  {
    type: 'expense',
    amount: 4,
    category: 'Food',
    description: 'Lunch',
    note: '',
    date: '2026-09-21',
    time: '13:00',
  },
];

async function main() {
  await connectDb();

  const existing = await getOne('SELECT id FROM users WHERE email = $1', [
    email,
  ]);
  if (existing) {
    console.log('Demo user already exists:', email);
    process.exit(0);
  }

  const user = await getOne(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    ['Alex Morgan', email, bcrypt.hashSync('password123', 10)]
  );

  for (const cat of DEFAULT_CATEGORIES) {
    await query(
      `INSERT INTO categories (user_id, name, type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, name, type) DO NOTHING`,
      [user.id, cat.name, cat.type]
    );
  }

  for (const tx of sampleTxs) {
    await query(
      `INSERT INTO transactions
        (user_id, type, amount, category, description, received_from, note, date, time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        user.id,
        tx.type,
        tx.amount,
        tx.category,
        tx.description,
        tx.received_from || null,
        tx.note || '',
        tx.date,
        tx.time,
      ]
    );
  }

  console.log('Seeded demo user in PostgreSQL:');
  console.log('  Email:    alex@moneytrack.app');
  console.log('  Password: password123');
  console.log('  Balance:  $61');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
