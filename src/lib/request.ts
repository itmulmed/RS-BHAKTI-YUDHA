/** IP pengunjung. Di Vercel header ini diisi oleh platform. */
export function clientIp(headers: Headers): string {
  return (
    headers.get('x-real-ip')?.trim() ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/** Pertahanan CSRF: header Origin harus sama dengan host situs ini. */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get('origin');
  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Tujuan setelah login: hanya halaman admin di situs sendiri. */
export function safeAdminPath(next: string | null): string {
  return next && /^\/admin(\/[a-z0-9-]+)*$/.test(next) ? next : '/admin';
}
