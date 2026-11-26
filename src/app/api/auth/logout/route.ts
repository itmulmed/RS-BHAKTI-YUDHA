import { type NextRequest } from 'next/server';
import { errorResponse, HttpError, json } from '@/lib/api';
import { clearSessionCookie, getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { collections } from '@/lib/db/collections';
import { isSameOrigin } from '@/lib/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Keluar: menaikkan versi sesi sehingga semua token lama akun ini tidak berlaku lagi. */
export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req.headers)) throw new HttpError(403, 'Asal permintaan tidak diizinkan.');
    const session = await getSession();
    if (session) {
      await collections(await getDb()).users.updateOne({ _id: session.userId }, { $inc: { session_version: 1 } });
    }
    const res = json({ ok: true });
    clearSessionCookie(res);
    return res;
  } catch (error) {
    return errorResponse(error);
  }
}
