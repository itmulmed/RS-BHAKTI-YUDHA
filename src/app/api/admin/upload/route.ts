import { adminRoute, HttpError, json } from '@/lib/api';
import { uploadImage } from '@/lib/cloudinary';
import { sniffImage } from '@/lib/cloudinary-sign';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Batas body fungsi Vercel 4,5 MB; gambar sudah dikecilkan di browser sebelum dikirim.
const MAX_BYTES = 4 * 1024 * 1024;
const KINDS = ['cover', 'logo', 'banner'];

export const POST = adminRoute('settings:write', async (req) => {
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES + 10_000) {
    throw new HttpError(413, 'Ukuran gambar terlalu besar (maksimal 4 MB).');
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const kind = form?.get('kind');
  if (typeof kind !== 'string' || !KINDS.includes(kind) || !file || typeof file === 'string') {
    throw new HttpError(400, 'Data unggahan tidak valid.');
  }
  if (file.size > MAX_BYTES) throw new HttpError(413, 'Ukuran gambar terlalu besar (maksimal 4 MB).');

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) throw new HttpError(400, 'Format gambar harus PNG, JPG, atau WebP.');

  const url = await uploadImage(new Blob([bytes], { type }), `rsby-linkhub/${kind}`);
  return json({ url }, 201);
});
