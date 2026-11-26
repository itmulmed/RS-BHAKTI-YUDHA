import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import type { ZodType, ZodTypeDef } from 'zod';
import { can, type Permission, type Role } from '@/lib/auth/roles';
import { getSession } from '@/lib/auth/session';
import { rateLimit } from '@/lib/rate-limit';
import { isSameOrigin } from '@/lib/request';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  console.error(error); // detail hanya di log server
  return json({ error: 'Terjadi kesalahan di server.' }, 500);
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T, ZodTypeDef, unknown>): Promise<T> {
  const text = await req.text();
  if (text.length > 20_000) throw new HttpError(413, 'Data terlalu besar.');
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Format data tidak valid.');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Data tidak valid.');
  return parsed.data;
}

export interface Actor {
  userId: string;
  email: string;
  role: Role;
}

type Context = { params: Record<string, string> };

/** Pembungkus wajib untuk semua API admin: sesi, peran, CSRF, dan rate limit. */
export function adminRoute(
  permission: Permission,
  handler: (req: NextRequest, actor: Actor, context: Context) => Promise<Response>
) {
  return async (req: NextRequest, context: Context): Promise<Response> => {
    try {
      const mutating = req.method !== 'GET' && req.method !== 'HEAD';
      if (mutating && !isSameOrigin(req.headers)) throw new HttpError(403, 'Asal permintaan tidak diizinkan.');
      const session = await getSession();
      if (!session) throw new HttpError(401, 'Sesi berakhir. Silakan masuk lagi.');
      if (!session.role || !can(session.role, permission)) {
        throw new HttpError(403, 'Anda tidak memiliki akses untuk tindakan ini.');
      }
      const allowed = await rateLimit(
        `admin:${mutating ? 'write' : 'read'}:${session.userId}`,
        mutating ? 60 : 240,
        60
      );
      if (!allowed) throw new HttpError(429, 'Terlalu banyak permintaan. Coba lagi sebentar.');
      return await handler(req, { ...session, role: session.role }, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
