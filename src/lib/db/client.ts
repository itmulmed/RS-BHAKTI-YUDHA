import 'server-only';
import { MongoClient, type Db } from 'mongodb';
import { requireEnv } from '@/lib/env';

// Koneksi dipakai ulang antar-request (penting di lingkungan serverless Vercel).
const globalForMongo = globalThis as unknown as { _mongoClient?: Promise<MongoClient> };

export function getClient(): Promise<MongoClient> {
  if (!globalForMongo._mongoClient) {
    const client = new MongoClient(requireEnv('MONGODB_URI'), {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
    globalForMongo._mongoClient = client.connect().catch((error: unknown) => {
      globalForMongo._mongoClient = undefined; // coba lagi di request berikutnya
      throw error;
    });
  }
  return globalForMongo._mongoClient;
}

export async function getDb(): Promise<Db> {
  return (await getClient()).db(requireEnv('MONGODB_DB'));
}
