import 'server-only';
import { createHmac, randomUUID } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { authSecret } from './env';
import { getDb } from './db/client';
import { collections } from './db/collections';
import { rateLimit, throttleOnce } from './rate-limit';
import { clientIp } from './request';

const VID_COOKIE = 'rsby_vid';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|uptime/i;

export interface Visitor {
  id: string;
  isNew: boolean;
}

export function getVisitor(req: NextRequest): Visitor {
  const existing = req.cookies.get(VID_COOKIE)?.value;
  if (existing && UUID_RE.test(existing)) return { id: existing, isNew: false };
  return { id: randomUUID(), isNew: true };
}

export function applyVisitorCookie(res: NextResponse, visitor: Visitor) {
  if (!visitor.isNew) return;
  res.cookies.set(VID_COOKIE, visitor.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
}

export function isBot(req: NextRequest): boolean {
  const ua = req.headers.get('user-agent') ?? '';
  return !ua || BOT_RE.test(ua);
}

/** IP tidak pernah disimpan mentah, hanya hash berkunci. */
export function hashIp(headers: Headers): string {
  return createHmac('sha256', authSecret()).update(`ip:${clientIp(headers)}`).digest('hex').slice(0, 32);
}

/**
 * Mencatat kejadian statistik. Rate limit: 60/menit per IP dan 1200/menit global.
 * Dedupe: view 30 menit, klik 5 detik per link, share 60 detik (per pengunjung).
 */
export async function recordEvent(
  req: NextRequest,
  type: 'view' | 'click' | 'share',
  visitorId: string,
  linkId?: string
): Promise<boolean> {
  try {
    if (type === 'click' && !linkId) return false;
    const ip = hashIp(req.headers);
    if (!(await rateLimit(`track:ip:${ip}`, 60, 60))) return false;
    if (!(await rateLimit('track:global', 1200, 60))) return false;

    const key = type === 'click' ? `click:${visitorId}:${linkId}` : `${type}:${visitorId}`;
    const seconds = type === 'view' ? 1800 : type === 'click' ? 5 : 60;
    if (!(await throttleOnce(key, seconds))) return false;

    const { pageViews, linkClicks } = collections(await getDb());
    const base = { _id: randomUUID(), visitor_id: visitorId, ip_hash: ip, created_at: new Date() };
    if (type === 'click') await linkClicks.insertOne({ ...base, link_id: linkId ?? null });
    else await pageViews.insertOne({ ...base, type });
    return true;
  } catch (e) {
    console.error('recordEvent gagal:', e); // statistik tidak boleh mengganggu pengunjung
    return false;
  }
}
