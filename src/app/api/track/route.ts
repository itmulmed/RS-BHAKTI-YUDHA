import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyVisitorCookie, getVisitor, isBot, recordEvent } from '@/lib/track';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ type: z.enum(['view', 'share']) }).strict();

export async function POST(req: NextRequest) {
  // Hanya terima dari situs sendiri (cegah pemalsuan dari situs lain)
  const origin = req.headers.get('origin');
  if (origin) {
    let ok = false;
    try {
      ok = new URL(origin).host === req.headers.get('host');
    } catch {
      ok = false;
    }
    if (!ok) return NextResponse.json({ ok: false }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const visitor = getVisitor(req);
  let counted = false;
  if (!isBot(req)) {
    counted = await recordEvent(req, parsed.data.type, visitor.id);
  }

  const res = NextResponse.json({ ok: true, counted }, { headers: { 'Cache-Control': 'no-store' } });
  applyVisitorCookie(res, visitor);
  return res;
}
