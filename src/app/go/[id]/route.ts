import { NextRequest, NextResponse } from 'next/server';
import { findActiveLink } from '@/lib/data/links';
import { applyVisitorCookie, getVisitor, isBot, recordEvent } from '@/lib/track';
import { isUuid } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Mencatat klik lalu mengarahkan ke tautan tujuan. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const home = new URL('/', req.url);
  if (!isUuid(params.id)) return NextResponse.redirect(home, 302);

  const link = await findActiveLink(params.id).catch((error: unknown) => {
    console.error(error);
    return null;
  });
  if (!link || !/^https?:\/\//i.test(link.url)) return NextResponse.redirect(home, 302);

  const visitor = getVisitor(req);
  if (!isBot(req)) {
    await recordEvent(req, 'click', visitor.id, link.id);
  }

  const res = NextResponse.redirect(link.url, 302);
  res.headers.set('Cache-Control', 'no-store');
  applyVisitorCookie(res, visitor);
  return res;
}
