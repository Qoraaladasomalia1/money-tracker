import pg from 'pg';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const { Pool } = pg;

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'moneytrack',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

if (!config.password && process.env.NODE_ENV === 'production') {
  console.error('Missing DB_PASSWORD in environment');
  process.exit(1);
}

export const pool = new Pool(config);

export async function query(text, params) {
  return pool.query(text, params);
}

export async function getOne(text, params) {
  const { rows } = await pool.query(text, params);
  return rows[0] ?? null;
}

export async function getMany(text, params) {
  const { rows } = await pool.query(text, params);
  return rows;
}

/** Apply schema.sql if tables are missing (safe to re-run). */
export async function ensureSchema() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const schemaPath = join(__dirname, '../../db/schema.sql');
  const sql = readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
}

export async function connectDb() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    await ensureSchema();
    console.log(
      `PostgreSQL connected: ${config.user}@${config.host}:${config.port}/${config.database}`
    );
  } finally {
    client.release();
  }
}
