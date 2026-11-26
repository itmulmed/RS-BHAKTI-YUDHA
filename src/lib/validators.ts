export const RESERVED_SLUGS = ['admin', 'login', 'api', 'go', '_next'];

/** Mengembalikan URL http/https yang valid (otomatis menambah https://), atau null jika tidak valid. */
export function normalizeUrl(input: string): string | null {
  let value = input.trim();
  if (!value || value.length > 2048 || /\s/.test(value)) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    if (/^(javascript|data|vbscript|file|mailto|tel):/i.test(value)) return null;
    value = `https://${value}`;
  }
  try {
    const u = new URL(value);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname.includes('.') && u.hostname !== 'localhost') return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function validateSlug(slug: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) {
    return 'Alamat hanya boleh huruf kecil, angka, dan tanda minus (3-40 karakter).';
  }
  if (RESERVED_SLUGS.includes(slug)) return 'Alamat ini dipakai sistem, pilih yang lain.';
  return null;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
