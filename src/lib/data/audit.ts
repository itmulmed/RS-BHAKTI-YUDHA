import 'server-only';
import { randomUUID } from 'crypto';
import type { ClientSession } from 'mongodb';
import type { Actor } from '@/lib/api';
import { getClient, getDb } from '@/lib/db/client';
import { collections, type AuditLogDoc } from '@/lib/db/collections';
import type { AuditRow } from '@/lib/types';

/** Menjalankan perubahan data dan audit log dalam satu transaksi (didukung Atlas). */
export async function transaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const client = await getClient();
  let result!: T;
  await client.withSession(async (session) => {
    await session.withTransaction(async () => {
      result = await work(session);
    });
  });
  return result;
}

export async function writeAudit(
  session: ClientSession,
  actor: Actor,
  entry: Pick<AuditLogDoc, 'action' | 'table_name' | 'record_id' | 'old_data' | 'new_data'>
) {
  const { auditLogs } = collections(await getDb());
  await auditLogs.insertOne(
    { _id: randomUUID(), actor_id: actor.userId, actor_email: actor.email, created_at: new Date(), ...entry },
    { session }
  );
}

export async function listAudit(limit = 100): Promise<AuditRow[]> {
  const { auditLogs } = collections(await getDb());
  const docs = await auditLogs.find({}).sort({ created_at: -1 }).limit(limit).toArray();
  return docs.map(({ _id, created_at, actor_id: _actor, ...rest }) => ({
    id: _id,
    created_at: created_at.toISOString(),
    ...rest,
  }));
}
