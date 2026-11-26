import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/token';

/**
 * Lapis pertama perlindungan /admin: cek tanda tangan & masa berlaku sesi.
 * Pemeriksaan penuh (akun aktif, pencabutan sesi, peran) tetap dilakukan lagi
 * di layout admin dan di setiap API admin.
 */
export async function middleware(request: NextRequest) {
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
    process.env.AUTH_SECRET
  );
  if (session) return NextResponse.next();

  const path = request.nextUrl.pathname;
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(path)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*'],
};
