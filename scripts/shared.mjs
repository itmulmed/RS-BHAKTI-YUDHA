/** Fungsi bersama untuk script setup (dijalankan di komputer admin, bukan di web). */
import { existsSync, readFileSync } from 'node:fs';
import { MongoClient } from 'mongodb';

/** Membaca .env.local lalu .env. Variabel yang sudah ada di lingkungan tidak ditimpa. */
export function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!match) continue;
      const [, name, raw] = match;
      process.env[name] ||= raw.replace(/^(["'])(.*)\1$/, '$2');
    }
  }
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diisi di .env.local`);
  return value;
}

export async function connect() {
  loadEnv();
  const client = new MongoClient(requireEnv('MONGODB_URI'), { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  return { client, db: client.db(requireEnv('MONGODB_DB')) };
}

export async function ensureIndexes(db) {
  const index = (name, keys, options) => db.collection(name).createIndex(keys, options);
  await Promise.all([
    index('users', { email: 1 }, { unique: true }),
    index('admins', { user_id: 1 }, { unique: true }),
    index('site_settings', { slug: 1 }, { unique: true }),
    index('links', { position: 1 }),
    index('page_views', { created_at: 1 }),
    index('link_clicks', { created_at: 1 }),
    index('link_clicks', { link_id: 1 }),
    index('audit_logs', { created_at: -1 }),
    index('rate_limits', { expires_at: 1 }, { expireAfterSeconds: 0 }),
  ]);
}
