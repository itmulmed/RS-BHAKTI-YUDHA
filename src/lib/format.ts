const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function parse(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const nf = (n: number) => new Intl.NumberFormat('id-ID').format(n);
export const dayShort = (date: string) => DAYS[parse(date).getUTCDay()];
export const dateShort = (date: string) => {
  const d = parse(date);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};
export const monthLabel = (date: string) => {
  const d = parse(date);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
export const weekLabel = (date: string) => {
  const d = parse(date);
  const end = new Date(d.getTime() + 6 * 86400000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} - ${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`;
};
export const dateTimeId = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export function ctr(clicks: number, views: number): string {
  if (!views) return '0%';
  return `${Math.round((clicks / views) * 1000) / 10}%`;
}
