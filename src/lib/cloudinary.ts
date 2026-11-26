import 'server-only';
import { signParams } from './cloudinary-sign';
import { requireEnv } from './env';

/** Unggah dari server memakai REST API Cloudinary. API secret tidak pernah dikirim ke browser. */
export async function uploadImage(file: Blob, folder: string): Promise<string> {
  const cloud = requireEnv('CLOUDINARY_CLOUD_NAME');
  const params = { folder, timestamp: String(Math.floor(Date.now() / 1000)) };
  const form = new FormData();
  form.append('file', file, 'upload');
  for (const [key, value] of Object.entries(params)) form.append(key, value);
  form.append('api_key', requireEnv('CLOUDINARY_API_KEY'));
  form.append('signature', signParams(params, requireEnv('CLOUDINARY_API_SECRET')));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, {
    method: 'POST',
    body: form,
    cache: 'no-store',
    signal: AbortSignal.timeout(9000),
  });
  const data = (await res.json().catch(() => null)) as {
    secure_url?: string;
    error?: { message?: string };
  } | null;
  if (!res.ok || !data?.secure_url) {
    throw new Error(`Cloudinary menolak unggahan: ${data?.error?.message ?? res.status}`);
  }
  return data.secure_url;
}
