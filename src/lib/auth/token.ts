/**
 * Token sesi bertanda tangan HMAC-SHA256 (Web Crypto, jalan di Edge & Node).
 * Isinya hanya id user, versi sesi, dan waktu kedaluwarsa.
 */
export const SESSION_COOKIE =
  process.env.NODE_ENV === 'production' ? '__Host-rsby_session' : 'rsby_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export interface SessionPayload {
  uid: string;
  ver: number;
  exp: number; // detik sejak epoch
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string) {
  const bin = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function importKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function createSessionToken(
  data: { uid: string; ver: number },
  secret: string,
  now = Date.now()
): Promise<string> {
  const payload: SessionPayload = { ...data, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await importKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now()
): Promise<SessionPayload | null> {
  if (!token || !secret || secret.length < 32 || token.length > 1024) return null;
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra !== undefined) return null;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await importKey(secret),
      fromBase64Url(signature),
      encoder.encode(body)
    );
    if (!valid) return null;
    const p = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as Partial<SessionPayload>;
    if (typeof p.uid !== 'string' || typeof p.ver !== 'number' || typeof p.exp !== 'number') return null;
    if (p.exp <= Math.floor(now / 1000)) return null;
    return { uid: p.uid, ver: p.ver, exp: p.exp };
  } catch {
    return null;
  }
}
