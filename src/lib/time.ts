/** Perhitungan periode dalam WIB (UTC+7, tanpa daylight saving). Minggu dimulai Senin. */
export const TIMEZONE = 'Asia/Jakarta';
const OFFSET_MS = 7 * 3600_000;
const DAY_MS = 86_400_000;

export type Unit = 'day' | 'week' | 'month';

/** Tanggal kalender WIB, direpresentasikan sebagai tengah malam UTC. */
function wibDate(now: Date): Date {
  const d = new Date(now.getTime() + OFFSET_MS);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Kunci bucket (YYYY-MM-DD) terurut dari terlama sampai periode berjalan. */
export function bucketKeys(unit: Unit, count: number, now = new Date()): string[] {
  const today = wibDate(now);
  const keys: string[] = [];
  for (let back = count - 1; back >= 0; back--) {
    if (unit === 'day') {
      keys.push(ymd(new Date(today.getTime() - back * DAY_MS)));
    } else if (unit === 'week') {
      const sinceMonday = (today.getUTCDay() + 6) % 7;
      keys.push(ymd(new Date(today.getTime() - (sinceMonday + back * 7) * DAY_MS)));
    } else {
      keys.push(ymd(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - back, 1))));
    }
  }
  return keys;
}

/** Waktu UTC dari tengah malam WIB pada tanggal YYYY-MM-DD. */
export function wibMidnight(key: string): Date {
  return new Date(Date.parse(`${key}T00:00:00Z`) - OFFSET_MS);
}

/** Awal rentang "N hari terakhir" termasuk hari ini. */
export function daysAgoStart(days: number, now = new Date()): Date {
  return wibMidnight(bucketKeys('day', days, now)[0]);
}
