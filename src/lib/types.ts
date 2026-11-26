export interface PageSettings {
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
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  color: string | null;
  open_new_tab: boolean;
  is_active: boolean;
  position: number;
}

export interface Counts {
  views: number;
  visitors: number;
  clicks: number;
}

export interface DayStat extends Counts {
  date: string; // YYYY-MM-DD (hari / Senin awal minggu / tanggal 1 bulan)
  shares: number;
}

export interface LinkStat {
  id: string;
  title: string;
  is_active: boolean;
  clicks: number;
  clicks_7d: number;
  clicks_30d: number;
}

export interface Stats {
  summary: {
    totals: Counts & { shares: number };
    today: Counts;
    week: Counts;
    month: Counts;
  };
  daily: DayStat[];
  weekly: DayStat[];
  monthly: DayStat[];
  links: LinkStat[];
}

export interface AuditRow {
  id: string;
  actor_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}
