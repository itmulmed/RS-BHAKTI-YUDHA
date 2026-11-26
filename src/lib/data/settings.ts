import 'server-only';
import { MongoServerError } from 'mongodb';
import { HttpError, type Actor } from '@/lib/api';
import { getDb } from '@/lib/db/client';
import { collections, SETTINGS_ID, type SiteSettingsDoc } from '@/lib/db/collections';
import type { SettingsInput } from '@/lib/schemas';
import type { PageSettings } from '@/lib/types';
import { transaction, writeAudit } from './audit';

function toSettings(d: SiteSettingsDoc): PageSettings {
  return {
    slug: d.slug,
    name: d.name,
    description: d.description,
    cover_url: d.cover_url,
    logo_url: d.logo_url,
    banner_url: d.banner_url ?? null,
    theme_color: d.theme_color,
    font: d.font,
    background: d.background,
    button_shape: d.button_shape,
    footer: d.footer,
  };
}

export async function getSettings(): Promise<PageSettings | null> {
  const doc = await collections(await getDb()).siteSettings.findOne({ _id: SETTINGS_ID });
  return doc ? toSettings(doc) : null;
}

/** Gambar baru wajib berasal dari akun Cloudinary sendiri; nilai lama boleh dipertahankan. */
function assertImageSources(next: SettingsInput, current: PageSettings) {
  const prefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
  for (const key of ['cover_url', 'logo_url', 'banner_url'] as const) {
    const value = next[key];
    if (value && value !== current[key] && !value.startsWith(prefix)) {
      throw new HttpError(400, 'Gambar harus diunggah lewat menu Desain.');
    }
  }
}

export async function updateSettings(input: SettingsInput, actor: Actor): Promise<PageSettings> {
  const { siteSettings } = collections(await getDb());
  try {
    return await transaction(async (session) => {
      const old = await siteSettings.findOne({ _id: SETTINGS_ID }, { session });
      if (!old) throw new HttpError(404, 'Pengaturan belum ada. Jalankan "npm run db:setup".');
      const before = toSettings(old);
      assertImageSources(input, before);
      await siteSettings.updateOne(
        { _id: SETTINGS_ID },
        { $set: { ...input, updated_at: new Date() } },
        { session }
      );
      await writeAudit(session, actor, {
        action: 'UPDATE',
        table_name: 'site_settings',
        record_id: SETTINGS_ID,
        old_data: { ...before },
        new_data: { ...input },
      });
      return { ...before, ...input };
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new HttpError(409, 'Alamat halaman sudah dipakai.');
    }
    throw error;
  }
}
