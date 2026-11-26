/** Daftar kunci ikon yang sah. Harus sama dengan ICONS di icons.ts. */
export const ICON_KEYS = [
  'link', 'globe', 'file', 'clipboard', 'download', 'stethoscope', 'heart', 'building', 'calendar', 'map', 'phone', 'whatsapp', 'mail', 'instagram', 'facebook', 'youtube', 'twitter', 'tiktok', 'telegram', 'video', 'users', 'shop', 'star', 'info',
] as const;

export type IconKey = (typeof ICON_KEYS)[number];
