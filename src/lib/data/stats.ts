import 'server-only';
import type { Document } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { collections } from '@/lib/db/collections';
import { bucketKeys, daysAgoStart, TIMEZONE, wibMidnight, type Unit } from '@/lib/time';
import type { Counts, DayStat, LinkStat, Stats } from '@/lib/types';
import { listLinks } from './links';

type Cols = ReturnType<typeof collections>;

const isType = (type: 'view' | 'share') => ({ $sum: { $cond: [{ $eq: ['$type', type] }, 1, 0] } });

async function totals(c: Cols, since?: Date): Promise<Counts & { shares: number }> {
  const match: Document[] = since ? [{ $match: { created_at: { $gte: since } } }] : [];
  const [row] = await c.pageViews
    .aggregate<{ views: number; visitors: number; shares: number }>(
      [
        ...match,
        // Dikelompokkan per pengunjung dulu agar hemat memori
        { $group: { _id: '$visitor_id', views: isType('view'), shares: isType('share') } },
        {
          $group: {
            _id: null,
            views: { $sum: '$views' },
            shares: { $sum: '$shares' },
            visitors: { $sum: { $cond: [{ $gt: ['$views', 0] }, 1, 0] } },
          },
        },
      ],
      { allowDiskUse: true }
    )
    .toArray();
  const clicks = await c.linkClicks.countDocuments(since ? { created_at: { $gte: since } } : {});
  return { views: row?.views ?? 0, visitors: row?.visitors ?? 0, shares: row?.shares ?? 0, clicks };
}

function bucket(unit: Unit): Document {
  return {
    $dateToString: {
      format: '%Y-%m-%d',
      timezone: TIMEZONE,
      date: { $dateTrunc: { date: '$created_at', unit, timezone: TIMEZONE, startOfWeek: 'monday' } },
    },
  };
}

async function series(c: Cols, unit: Unit, count: number, now: Date): Promise<DayStat[]> {
  const keys = bucketKeys(unit, count, now);
  const match = { $match: { created_at: { $gte: wibMidnight(keys[0]) } } };
  const [views, clicks] = await Promise.all([
    c.pageViews
      .aggregate<{ _id: string; views: number; visitors: number; shares: number }>(
        [
          match,
          {
            $group: {
              _id: { date: bucket(unit), visitor: '$visitor_id' },
              views: isType('view'),
              shares: isType('share'),
            },
          },
          {
            $group: {
              _id: '$_id.date',
              views: { $sum: '$views' },
              shares: { $sum: '$shares' },
              visitors: { $sum: { $cond: [{ $gt: ['$views', 0] }, 1, 0] } },
            },
          },
        ],
        { allowDiskUse: true }
      )
      .toArray(),
    c.linkClicks
      .aggregate<{ _id: string; clicks: number }>([match, { $group: { _id: bucket(unit), clicks: { $sum: 1 } } }])
      .toArray(),
  ]);
  const viewMap = new Map(views.map((r) => [r._id, r]));
  const clickMap = new Map(clicks.map((r) => [r._id, r.clicks]));
  return keys.map((date) => ({
    date,
    views: viewMap.get(date)?.views ?? 0,
    visitors: viewMap.get(date)?.visitors ?? 0,
    shares: viewMap.get(date)?.shares ?? 0,
    clicks: clickMap.get(date) ?? 0,
  }));
}

async function linkStats(c: Cols, now: Date): Promise<LinkStat[]> {
  const since = (days: number) => ({
    $sum: { $cond: [{ $gte: ['$created_at', new Date(now.getTime() - days * 86_400_000)] }, 1, 0] },
  });
  const [links, rows] = await Promise.all([
    listLinks(),
    c.linkClicks
      .aggregate<{ _id: string; total: number; d7: number; d30: number }>(
        [
          { $match: { link_id: { $ne: null } } },
          { $group: { _id: '$link_id', total: { $sum: 1 }, d7: since(7), d30: since(30) } },
        ],
        { allowDiskUse: true }
      )
      .toArray(),
  ]);
  const map = new Map(rows.map((r) => [r._id, r]));
  // listLinks sudah terurut posisi; sort stabil mempertahankannya untuk klik yang sama
  return links
    .map((l) => ({
      id: l.id,
      title: l.title,
      is_active: l.is_active,
      clicks: map.get(l.id)?.total ?? 0,
      clicks_7d: map.get(l.id)?.d7 ?? 0,
      clicks_30d: map.get(l.id)?.d30 ?? 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

export async function getStats(now = new Date()): Promise<Stats> {
  const c = collections(await getDb());
  const [all, today, week, month, daily, weekly, monthly, links] = await Promise.all([
    totals(c),
    totals(c, daysAgoStart(1, now)),
    totals(c, daysAgoStart(7, now)),
    totals(c, daysAgoStart(30, now)),
    series(c, 'day', 30, now),
    series(c, 'week', 12, now),
    series(c, 'month', 12, now),
    linkStats(c, now),
  ]);
  return { summary: { totals: all, today, week, month }, daily, weekly, monthly, links };
}
