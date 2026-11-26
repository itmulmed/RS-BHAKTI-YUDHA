import { createHash } from 'crypto';

/** Tanda tangan unggahan Cloudinary: SHA-1 dari parameter terurut + API secret. */
export function signParams(params: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(payload + apiSecret).digest('hex');
}

/** Memeriksa isi file (magic bytes), bukan hanya nama atau header yang bisa dipalsukan. */
export function sniffImage(bytes: Uint8Array): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  const has = (offset: number, sig: number[]) => sig.every((b, i) => bytes[offset + i] === b);
  if (has(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (has(0, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (has(0, [0x52, 0x49, 0x46, 0x46]) && has(8, [0x57, 0x45, 0x42, 0x50])) return 'image/webp';
  return null;
}
