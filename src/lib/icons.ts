import {
  Link2, Globe, FileText, Phone, Mail, MessageCircle, Instagram, Facebook, Youtube,
  Twitter, MapPin, Calendar, Stethoscope, HeartPulse, Download, ShoppingBag,
  ClipboardList, Building2, Users, Video, Music2, Send, Star, Info,
  type LucideIcon,
} from 'lucide-react';
import type { IconKey } from './icon-keys';

export const ICONS: { key: IconKey; label: string; Icon: LucideIcon }[] = [
  { key: 'link', label: 'Tautan', Icon: Link2 },
  { key: 'globe', label: 'Website', Icon: Globe },
  { key: 'file', label: 'Dokumen', Icon: FileText },
  { key: 'clipboard', label: 'Formulir', Icon: ClipboardList },
  { key: 'download', label: 'Unduh', Icon: Download },
  { key: 'stethoscope', label: 'Dokter', Icon: Stethoscope },
  { key: 'heart', label: 'Kesehatan', Icon: HeartPulse },
  { key: 'building', label: 'Rumah sakit', Icon: Building2 },
  { key: 'calendar', label: 'Jadwal', Icon: Calendar },
  { key: 'map', label: 'Lokasi', Icon: MapPin },
  { key: 'phone', label: 'Telepon', Icon: Phone },
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { key: 'mail', label: 'Email', Icon: Mail },
  { key: 'instagram', label: 'Instagram', Icon: Instagram },
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
  { key: 'youtube', label: 'YouTube', Icon: Youtube },
  { key: 'twitter', label: 'X / Twitter', Icon: Twitter },
  { key: 'tiktok', label: 'TikTok', Icon: Music2 },
  { key: 'telegram', label: 'Telegram', Icon: Send },
  { key: 'video', label: 'Video', Icon: Video },
  { key: 'users', label: 'Komunitas', Icon: Users },
  { key: 'shop', label: 'Toko', Icon: ShoppingBag },
  { key: 'star', label: 'Favorit', Icon: Star },
  { key: 'info', label: 'Informasi', Icon: Info },
];

export function getIcon(key: string): LucideIcon {
  return ICONS.find((i) => i.key === key)?.Icon ?? Link2;
}
