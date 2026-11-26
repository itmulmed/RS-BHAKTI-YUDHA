// Memindahkan data lama (hasil docs/export-data-lama.sql) ke MongoDB dan gambar ke Cloudinary.
//   npm run db:import -- legacy-export.json
// Pengaturan & tautan dengan ID sama akan DITIMPA. Statistik & riwayat tidak digandakan.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { connect, ensureIndexes, requireEnv } from './shared.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Cara pakai: npm run db:import -- legacy-export.json');
  process.exit(1);
}

function readExport(path) {
  let data = JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''));
  // Terima objek langsung, atau hasil unduhan SQL Editor: [{ "data": {...} }]
  if (Array.isArray(data)) data = data[0];
  if (data?.data) data = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
  for (const key of ['page_settings', 'links', 'analytics_events', 'audit_log']) {
    if (!Array.isArray(data?.[key])) throw new Error(`Bagian "${key}" tidak ditemukan di file ekspor.`);
  }
  return data;
}

async function moveImage(url, kind) {
  if (!url || url.startsWith('https://res.cloudinary.com/')) return url ?? null;
  const cloud = requireEnv('CLOUDINARY_CLOUD_NAME');
  const params = { folder: `rsby-linkhub/${kind}`, timestamp: String(Math.floor(Date.now() / 1000)) };
  const payload = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  const form = new FormData();
  form.append('file', url); // Cloudinary mengambil sendiri dari URL lama
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append('api_key', requireEnv('CLOUDINARY_API_KEY'));
  form.append('signature', createHash('sha1').update(payload + requireEnv('CLOUDINARY_API_SECRET')).digest('hex'));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.secure_url) {
    throw new Error(`Gagal memindahkan gambar ${kind}: ${body?.error?.message ?? res.status}`);
  }
  return body.secure_url;
}

async function bulk(collection, operations) {
  for (let i = 0; i < operations.length; i += 1000) {
    await collection.bulkWrite(operations.slice(i, i + 1000), { ordered: false });
  }
}

const replace = (doc) => ({ replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } });
const insertOnce = ({ _id, ...doc }) => ({
  updateOne: { filter: { _id }, update: { $setOnInsert: doc }, upsert: true },
});

const data = readExport(file);
const { client, db } = await connect();
try {
  await ensureIndexes(db);

  const s = data.page_settings[0];
  if (s) {
    await db.collection('site_settings').bulkWrite([
      replace({
        _id: 'main',
        slug: s.slug,
        name: s.name,
        description: s.description ?? null,
        cover_url: await moveImage(s.cover_url, 'cover'),
        logo_url: await moveImage(s.logo_url, 'logo'),
        banner_url: null,
        theme_color: s.theme_color,
        font: s.font,
        background: s.background,
        button_shape: s.button_shape,
        footer: s.footer ?? null,
        updated_at: new Date(s.updated_at ?? Date.now()),
      }),
    ]);
  }

  // ID lama dipertahankan sehingga alamat /go/<id> dan statistik tetap tersambung
  await bulk(db.collection('links'), data.links.map((l) => replace({
    _id: l.id,
    title: l.title,
    url: l.url,
    icon: l.icon,
    color: l.color ?? null,
    open_new_tab: l.open_new_tab,
    is_active: l.is_active,
    position: l.position,
    created_at: new Date(l.created_at),
    updated_at: new Date(l.updated_at),
  })));

  const event = (e) => ({
    _id: `legacy-${e.id}`,
    visitor_id: e.visitor_id,
    ip_hash: e.ip_hash ?? null,
    created_at: new Date(e.created_at),
  });
  const clicks = data.analytics_events.filter((e) => e.type === 'click');
  const views = data.analytics_events.filter((e) => e.type !== 'click');
  await bulk(db.collection('link_clicks'), clicks.map((e) => insertOnce({ ...event(e), link_id: e.link_id ?? null })));
  await bulk(db.collection('page_views'), views.map((e) => insertOnce({ ...event(e), type: e.type })));

  await bulk(db.collection('audit_logs'), data.audit_log.map((a) => insertOnce({
    _id: `legacy-${a.id}`,
    actor_id: a.actor_id ?? null,
    actor_email: a.actor_email ?? null,
    action: a.action,
    table_name: a.table_name,
    record_id: a.record_id ?? null,
    old_data: a.old_data ?? null,
    new_data: a.new_data ?? null,
    created_at: new Date(a.created_at),
  })));

  console.log('Impor selesai. Cocokkan jumlah berikut dengan data lama:');
  console.table({
    tautan: data.links.length,
    kunjungan_dan_share: views.length,
    klik: clicks.length,
    riwayat: data.audit_log.length,
  });
} catch (error) {
  console.error(`Gagal: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
