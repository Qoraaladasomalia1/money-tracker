import 'dotenv/config';
import pg from 'pg';
import { connectDb, pool } from '../src/db/index.js';

const { Client } = pg;

const base = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

const admin = new Client({ ...base, database: 'postgres' });
await admin.connect();
const { rows } = await admin.query(
  'SELECT 1 FROM pg_database WHERE datname = $1',
  ['moneytrack']
);
if (!rows.length) {
  await admin.query('CREATE DATABASE moneytrack');
  console.log('Created database moneytrack');
} else {
  console.log('Database moneytrack already exists');
}
await admin.end();

await connectDb();
await pool.end();
console.log('Schema applied successfully');
