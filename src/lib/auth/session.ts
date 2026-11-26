import 'server-only';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { authSecret } from '@/lib/env';
import { getDb } from '@/lib/db/client';
import { collections } from '@/lib/db/collections';
import { isRole, type Role } from './roles';
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS, verifySessionToken } from './token';

export interface Session {
  userId: string;
  email: string;
  /** null = akun login tetapi tidak (lagi) terdaftar sebagai admin */
  role: Role | null;
}

/** Sesi yang sudah diverifikasi ke database. */
export async function getSession(): Promise<Session | null> {
  const payload = await verifySessionToken(cookies().get(SESSION_COOKIE)?.value, authSecret());
  if (!payload) return null;
  const { users, admins } = collections(await getDb());
  const user = await users.findOne({ _id: payload.uid });
  if (!user || !user.is_active || user.session_version !== payload.ver) return null;
  const admin = await admins.findOne({ user_id: user._id });
  return { userId: user._id, email: user.email, role: admin && isRole(admin.role) ? admin.role : null };
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export async function setSessionCookie(res: NextResponse, uid: string, ver: number) {
  const token = await createSessionToken({ uid, ver }, authSecret());
  res.cookies.set(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_TTL_SECONDS });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}
