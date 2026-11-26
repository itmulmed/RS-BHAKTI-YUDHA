import 'server-only';
import { MongoServerError } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { collections } from '@/lib/db/collections';

function isDuplicateKey(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === 11000;
}

/** Batas jumlah kejadian per jendela waktu. Tersimpan di MongoDB agar berlaku di semua instance. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const { rateLimits } = collections(await getDb());
  const windowMs = windowSeconds * 1000;
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const run = () =>
    rateLimits.findOneAndUpdate(
      { _id: `r:${key}:${windowStart}` },
      { $inc: { count: 1 }, $setOnInsert: { expires_at: new Date(windowStart + windowMs * 2) } },
      { upsert: true, returnDocument: 'after' }
    );
  let doc;
  try {
    doc = await run();
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    doc = await run();
  }
  return (doc?.count ?? 1) <= limit;
}

/** true hanya sekali per `seconds` untuk key yang sama (atomik). Dipakai untuk dedupe statistik. */
export async function throttleOnce(key: string, seconds: number): Promise<boolean> {
  const { rateLimits } = collections(await getDb());
  const now = Date.now();
  try {
    // Cocok hanya bila sudah kedaluwarsa. Bila masih berlaku, upsert bentrok pada _id.
    await rateLimits.updateOne(
      { _id: `t:${key}`, expires_at: { $lte: new Date(now) } },
      { $set: { expires_at: new Date(now + seconds * 1000) } },
      { upsert: true }
    );
    return true;
  } catch (error) {
    if (isDuplicateKey(error)) return false;
    throw error;
  }
}
