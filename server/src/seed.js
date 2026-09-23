import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { supabase, assertOk } from './db/index.js';

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
  const { data: existing, error: findErr } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  assertOk(findErr);

  if (existing) {
    console.log('Demo user already exists:', email);
    process.exit(0);
  }

  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({
      name: 'Alex Morgan',
      email,
      password_hash: bcrypt.hashSync('password123', 10),
    })
    .select('*')
    .single();
  assertOk(userErr, 'Failed to create demo user');

  const { error: catErr } = await supabase.from('categories').insert(
    DEFAULT_CATEGORIES.map((cat) => ({
      user_id: user.id,
      name: cat.name,
      type: cat.type,
    }))
  );
  assertOk(catErr, 'Failed to seed categories');

  const { error: txErr } = await supabase.from('transactions').insert(
    sampleTxs.map((tx) => ({
      user_id: user.id,
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description,
      received_from: tx.received_from || null,
      note: tx.note || '',
      date: tx.date,
      time: tx.time,
    }))
  );
  assertOk(txErr, 'Failed to seed transactions');

  console.log('Seeded demo user in Supabase:');
  console.log('  Email:    alex@moneytrack.app');
  console.log('  Password: password123');
  console.log('  Balance:  $61.00');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
