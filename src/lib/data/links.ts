import 'server-only';
import { randomUUID } from 'crypto';
import { HttpError, type Actor } from '@/lib/api';
import { getDb } from '@/lib/db/client';
import { collections, type LinkDoc } from '@/lib/db/collections';
import type { LinkCreateInput, LinkUpdateInput } from '@/lib/schemas';
import type { LinkItem } from '@/lib/types';
import { transaction, writeAudit } from './audit';

function toLink(d: LinkDoc): LinkItem {
  return {
    id: d._id,
    title: d.title,
    url: d.url,
    icon: d.icon,
    color: d.color,
    open_new_tab: d.open_new_tab,
    is_active: d.is_active,
    position: d.position,
  };
}

export async function listLinks({ activeOnly = false } = {}): Promise<LinkItem[]> {
  const { links } = collections(await getDb());
  const docs = await links
    .find(activeOnly ? { is_active: true } : {})
    .sort({ position: 1, created_at: 1 })
    .toArray();
  return docs.map(toLink);
}

export async function findActiveLink(id: string): Promise<LinkItem | null> {
  const doc = await collections(await getDb()).links.findOne({ _id: id, is_active: true });
  return doc ? toLink(doc) : null;
}

export async function createLink(input: LinkCreateInput, actor: Actor): Promise<LinkItem> {
  const { links } = collections(await getDb());
  return transaction(async (session) => {
    if ((await links.countDocuments({}, { session })) >= 200) {
      throw new HttpError(400, 'Jumlah tautan maksimal 200.');
    }
    const last = await links.find({}, { session }).sort({ position: -1 }).limit(1).next();
    const now = new Date();
    const doc: LinkDoc = {
      _id: randomUUID(),
      ...input,
      position: (last?.position ?? 0) + 1,
      created_at: now,
      updated_at: now,
    };
    await links.insertOne(doc, { session });
    const item = toLink(doc);
    await writeAudit(session, actor, {
      action: 'INSERT',
      table_name: 'links',
      record_id: doc._id,
      old_data: null,
      new_data: { ...item },
    });
    return item;
  });
}

export async function updateLink(id: string, input: LinkUpdateInput, actor: Actor): Promise<LinkItem> {
  const { links } = collections(await getDb());
  return transaction(async (session) => {
    const old = await links.findOne({ _id: id }, { session });
    if (!old) throw new HttpError(404, 'Tautan tidak ditemukan.');
    await links.updateOne({ _id: id }, { $set: { ...input, updated_at: new Date() } }, { session });
    const before = toLink(old);
    const after: LinkItem = { ...before, ...input };
    await writeAudit(session, actor, {
      action: 'UPDATE',
      table_name: 'links',
      record_id: id,
      old_data: { ...before },
      new_data: { ...after },
    });
    return after;
  });
}

export async function deleteLink(id: string, actor: Actor): Promise<void> {
  const { links } = collections(await getDb());
  await transaction(async (session) => {
    const old = await links.findOneAndDelete({ _id: id }, { session });
    if (!old) throw new HttpError(404, 'Tautan tidak ditemukan.');
    await writeAudit(session, actor, {
      action: 'DELETE',
      table_name: 'links',
      record_id: id,
      old_data: { ...toLink(old) },
      new_data: null,
    });
  });
}

export async function reorderLinks(ids: string[], actor: Actor): Promise<void> {
  const { links } = collections(await getDb());
  await transaction(async (session) => {
    // Daftar harus lengkap agar tidak ada posisi ganda
    const total = await links.countDocuments({}, { session });
    const found = await links.countDocuments({ _id: { $in: ids } }, { session });
    if (found !== ids.length || total !== ids.length) {
      throw new HttpError(409, 'Daftar tautan sudah berubah. Muat ulang halaman.');
    }
    await links.bulkWrite(
      ids.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { position: index + 1, updated_at: new Date() } } },
      })),
      { session }
    );
    await writeAudit(session, actor, {
      action: 'REORDER',
      table_name: 'links',
      record_id: null,
      old_data: null,
      new_data: { order: ids },
    });
  });
}
