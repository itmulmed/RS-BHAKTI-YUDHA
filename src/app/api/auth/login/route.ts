import { type NextRequest } from 'next/server';
import { errorResponse, HttpError, json, parseBody } from '@/lib/api';
import { verifyPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { collections } from '@/lib/db/collections';
import { rateLimit } from '@/lib/rate-limit';
import { isSameOrigin } from '@/lib/request';
import { loginSchema } from '@/lib/schemas';
import { hashIp } from '@/lib/track';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FIFTEEN_MINUTES = 15 * 60;

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req.headers)) throw new HttpError(403, 'Asal permintaan tidak diizinkan.');
    const ip = hashIp(req.headers);
    const tooMany = new HttpError(429, 'Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.');
    if (!(await rateLimit(`login:ip:${ip}`, 20, FIFTEEN_MINUTES))) throw tooMany;

    const { email, password } = await parseBody(req, loginSchema);
    if (!(await rateLimit(`login:pair:${ip}:${email}`, 5, FIFTEEN_MINUTES))) throw tooMany;
    if (!(await rateLimit(`login:email:${email}`, 30, FIFTEEN_MINUTES))) throw tooMany;

    const { users, admins } = collections(await getDb());
    const user = await users.findOne({ email });
    const passwordOk = await verifyPassword(password, user?.password_hash);
    const admin = user && passwordOk && user.is_active ? await admins.findOne({ user_id: user._id }) : null;
    if (!user || !admin) throw new HttpError(401, 'Email atau kata sandi salah.');

    await users.updateOne({ _id: user._id }, { $set: { last_login_at: new Date() } });
    const res = json({ ok: true });
    await setSessionCookie(res, user._id, user.session_version);
    return res;
  } catch (error) {
    return errorResponse(error);
  }
}
