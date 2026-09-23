import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function fail(lines) {
  console.error('');
  for (const line of lines) console.error(line);
  console.error('');
  process.exit(1);
}

if (!url || !key) {
  fail([
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env',
    'Supabase → Project Settings → API Keys',
  ]);
}

if (
  key.includes('PASTE_') ||
  key.includes('your_') ||
  key === 'SUPABASE_SERVICE_ROLE_KEY'
) {
  fail([
    '❌ SUPABASE_SERVICE_ROLE_KEY is still a placeholder.',
    '',
    '✅ Do this:',
    '   1. Supabase Dashboard → Project Settings → API Keys',
    '   2. Create/copy a Secret key (starts with sb_secret_...)',
    '      OR Legacy API Keys → service_role → Reveal → Copy (starts with eyJ...)',
    '   3. Paste into server/.env:',
    '      SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   (or the eyJ... JWT)',
    '   4. Save the file and restart: npm run dev',
    '',
    'Do NOT use sb_publishable_... (that causes RLS / invalid key errors).',
  ]);
}

if (key.startsWith('sb_publishable_')) {
  fail([
    '❌ You pasted the PUBLISHABLE key (sb_publishable_...).',
    '   The server needs the SECRET key instead.',
    '',
    '✅ Use:',
    '   - Secret key: sb_secret_...',
    '   - or Legacy service_role JWT: eyJ...',
  ]);
}

const isSecret =
  key.startsWith('sb_secret_') ||
  (key.startsWith('eyJ') && key.split('.').length === 3);

if (!isSecret) {
  fail([
    '❌ SUPABASE_SERVICE_ROLE_KEY does not look like a valid secret key.',
    `   Got prefix: ${key.slice(0, 20)}...`,
    '',
    '✅ Expected one of:',
    '   sb_secret_...     (new secret key)',
    '   eyJ...            (legacy service_role JWT)',
  ]);
}

if (key.startsWith('eyJ')) {
  try {
    const payload = JSON.parse(
      Buffer.from(key.split('.')[1], 'base64url').toString('utf8')
    );
    if (payload.role && payload.role !== 'service_role') {
      fail([
        `❌ This JWT has role "${payload.role}", expected "service_role".`,
        '   Copy Legacy API Keys → service_role (not anon).',
      ]);
    }
  } catch {
    // let client fail later if JWT is malformed
  }
}

/** Server-side client (secret / service_role — bypasses RLS) */
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export function assertOk(error, fallback = 'Database error') {
  if (error) {
    let message = error.message || fallback;
    if (/invalid api key/i.test(message)) {
      message =
        'Invalid Supabase API key. In server/.env use the Secret key (sb_secret_...) or legacy service_role JWT (eyJ...), not the publishable key.';
    }
    if (/row-level security/i.test(message)) {
      message =
        'Database RLS blocked this action. Use the Supabase secret/service_role key in server/.env (not publishable/anon).';
    }
    const err = new Error(message);
    err.cause = error;
    throw err;
  }
}
