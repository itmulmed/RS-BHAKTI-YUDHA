// Membuat collections, index, dan pengaturan awal halaman. Aman dijalankan ulang.
import { connect, ensureIndexes } from './shared.mjs';

const NAMES = ['admins', 'users', 'site_settings', 'links', 'page_views', 'link_clicks', 'audit_logs', 'rate_limits'];

const { client, db } = await connect();
try {
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));
  for (const name of NAMES) {
    if (!existing.has(name)) await db.createCollection(name);
  }
  await ensureIndexes(db);

  // Nilai awal yang sama dengan versi sebelumnya. Tidak menimpa pengaturan yang sudah ada.
  const result = await db.collection('site_settings').updateOne(
    { _id: 'main' },
    {
      $setOnInsert: {
        slug: 'rsubhaktiyudha',
        name: 'RSU Bhakti Yudha',
        description: 'Rumah Sakit Umum Bhakti Yudha Depok',
        cover_url: null,
        logo_url: null,
        banner_url: null,
        theme_color: '#16a34a',
        font: 'poppins',
        background: 'soft',
        button_shape: 'rounded',
        footer: '© RSU Bhakti Yudha',
        updated_at: new Date(),
      },
    },
    { upsert: true }
  );
  console.log(`Database "${db.databaseName}" siap.`);
  console.log(result.upsertedCount ? 'Pengaturan awal dibuat.' : 'Pengaturan sudah ada, tidak diubah.');
} finally {
  await client.close();
}
