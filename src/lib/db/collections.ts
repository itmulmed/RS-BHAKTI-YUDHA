import 'server-only';
import type { Db } from 'mongodb';
import type { Role } from '@/lib/auth/roles';

/** Identitas & kredensial login. */
export interface UserDoc {
  _id: string;
  email: string; // selalu huruf kecil
  name: string;
  password_hash: string;
  is_active: boolean;
  session_version: number;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

/** Hak akses admin. User tanpa dokumen di sini tidak bisa masuk panel. */
export interface AdminDoc {
  _id: string;
  user_id: string;
  role: Role;
  created_at: Date;
}

export interface SiteSettingsDoc {
  _id: string; // selalu 'main'
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  logo_url: string | null;
  banner_url: string | null;
  theme_color: string;
  font: string;
  background: string;
  button_shape: string;
  footer: string | null;
  updated_at: Date;
}

export interface LinkDoc {
  _id: string;
  title: string;
  url: string;
  icon: string;
  color: string | null;
  open_new_tab: boolean;
  is_active: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface PageViewDoc {
  _id: string;
  type: 'view' | 'share';
  visitor_id: string;
  ip_hash: string | null;
  created_at: Date;
}

export interface LinkClickDoc {
  _id: string;
  link_id: string | null;
  visitor_id: string;
  ip_hash: string | null;
  created_at: Date;
}

export interface AuditLogDoc {
  _id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'REORDER';
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: Date;
}

/** Penghitung rate limit & dedupe; dokumen lama dihapus otomatis oleh TTL index. */
export interface RateLimitDoc {
  _id: string;
  count?: number;
  expires_at: Date;
}

export const SETTINGS_ID = 'main';

export const collections = (db: Db) => ({
  users: db.collection<UserDoc>('users'),
  admins: db.collection<AdminDoc>('admins'),
  siteSettings: db.collection<SiteSettingsDoc>('site_settings'),
  links: db.collection<LinkDoc>('links'),
  pageViews: db.collection<PageViewDoc>('page_views'),
  linkClicks: db.collection<LinkClickDoc>('link_clicks'),
  auditLogs: db.collection<AuditLogDoc>('audit_logs'),
  rateLimits: db.collection<RateLimitDoc>('rate_limits'),
});
