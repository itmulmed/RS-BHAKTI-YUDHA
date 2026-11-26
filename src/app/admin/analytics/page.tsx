'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, Trophy } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { DayStat, Stats } from '@/lib/types';
import { ctr, dateShort, monthLabel, nf, weekLabel } from '@/lib/format';

type Range = 'daily' | 'weekly' | 'monthly';

const RANGES: { key: Range; label: string; hint: string }[] = [
  { key: 'daily', label: 'Harian', hint: '30 hari terakhir' },
  { key: 'weekly', label: 'Mingguan', hint: '12 minggu terakhir (Senin - Minggu)' },
  { key: 'monthly', label: 'Bulanan', hint: '12 bulan terakhir' },
];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('daily');

  useEffect(() => {
    api<{ stats: Stats }>('/api/admin/stats')
      .then((data) => setStats(data.stats))
      .catch((e: Error) => setError(`Gagal memuat statistik: ${e.message}`))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="animate-spin" size={20} /> Memuat statistik...
      </div>
    );
  }
  if (!stats) return <p className="card p-6 text-sm text-red-700">{error || 'Statistik tidak tersedia.'}</p>;

  const series: DayStat[] = stats[range];
  const max = Math.max(1, ...series.map((s) => s.views));
  const label = (d: string) => (range === 'daily' ? dateShort(d) : range === 'weekly' ? weekLabel(d) : monthLabel(d));
  const hint = RANGES.find((r) => r.key === range)?.hint ?? '';
  const top = stats.links[0];
  const periods = [
    { title: 'Hari ini', c: stats.summary.today },
    { title: '7 hari terakhir', c: stats.summary.week },
    { title: '30 hari terakhir', c: stats.summary.month },
    { title: 'Sepanjang waktu', c: stats.summary.totals },
  ];

  function exportCsv() {
    const esc = (v: string | number) => {
      const text = String(v);
      // Cegah teks dibaca sebagai rumus oleh aplikasi spreadsheet
      const safe = typeof v === 'string' && /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows: (string | number)[][] = [
      [`Statistik ${range}`],
      ['Periode', 'Kunjungan', 'Pengunjung unik', 'Klik link', 'Dibagikan'],
      ...series.map((s) => [label(s.date), s.views, s.visitors, s.clicks, s.shares]),
      [],
      ['Statistik per link'],
      ['Judul', 'Total klik', 'Klik 7 hari', 'Klik 30 hari', 'Status'],
      ...stats!.links.map((l) => [l.title, l.clicks, l.clicks_7d, l.clicks_30d, l.is_active ? 'Aktif' : 'Nonaktif']),
    ];
    const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistik-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Analitik</h1>
          <p className="text-sm text-slate-500">Data nyata dari pengunjung halaman publik (zona waktu WIB).</p>
        </div>
        <button type="button" onClick={exportCsv} className="btn-outline">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Ringkasan">
        {periods.map((p) => (
          <div key={p.title} className="card p-4">
            <p className="text-xs font-semibold text-slate-500">{p.title}</p>
            <p className="mt-1 text-2xl font-bold">{nf(p.c.views)}</p>
            <p className="text-xs text-slate-500">kunjungan</p>
            <p className="mt-2 text-xs text-slate-600">{nf(p.c.visitors)} pengunjung unik</p>
            <p className="text-xs text-slate-600">{nf(p.c.clicks)} klik link ({ctr(p.c.clicks, p.c.views)})</p>
          </div>
        ))}
      </section>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Tren kunjungan</h2>
            <p className="text-xs text-slate-500">{hint}</p>
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1" role="tablist">
            {RANGES.map((r) => (
              <button key={r.key} type="button" role="tab" aria-selected={range === r.key} onClick={() => setRange(r.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${range === r.key ? 'bg-white text-green-700 shadow-sm' : 'text-slate-600'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex h-44 items-end gap-0.5 sm:gap-1" role="img" aria-label={`Grafik kunjungan ${range}`}>
          {series.map((s) => (
            <div key={s.date} className="group flex h-full min-w-0 flex-1 flex-col justify-end" title={`${label(s.date)}: ${s.views} kunjungan, ${s.clicks} klik`}>
              <div className="flex w-full items-end justify-center gap-px" style={{ height: `${Math.max(3, (s.views / max) * 100)}%` }}>
                <div className="w-full flex-1 rounded-t bg-green-500" style={{ height: '100%' }} />
                <div className="w-full flex-1 rounded-t bg-green-900" style={{ height: `${s.views ? Math.min(100, (s.clicks / s.views) * 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Kunjungan</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-900" /> Klik (proporsi terhadap kunjungan)</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[460px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="py-2 pr-3 font-semibold">Periode</th>
                <th className="py-2 pr-3 text-right font-semibold">Kunjungan</th>
                <th className="py-2 pr-3 text-right font-semibold">Pengunjung unik</th>
                <th className="py-2 pr-3 text-right font-semibold">Klik</th>
                <th className="py-2 text-right font-semibold">Dibagikan</th>
              </tr>
            </thead>
            <tbody>
              {[...series].reverse().map((s) => (
                <tr key={s.date} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{label(s.date)}</td>
                  <td className="py-2 pr-3 text-right">{nf(s.views)}</td>
                  <td className="py-2 pr-3 text-right">{nf(s.visitors)}</td>
                  <td className="py-2 pr-3 text-right">{nf(s.clicks)}</td>
                  <td className="py-2 text-right">{nf(s.shares)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {range !== 'daily' && (
          <p className="mt-2 text-xs text-slate-500">Pengunjung unik dihitung per periode, jadi orang yang sama di hari berbeda dihitung satu kali dalam periode tersebut.</p>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-1 font-bold">Link terpopuler</h2>
        {top && top.clicks > 0 && (
          <p className="mb-3 flex items-start gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-900">
            <Trophy size={16} className="mt-0.5 shrink-0" /> <span className="min-w-0 break-words">{top.title} ({nf(top.clicks)} klik)</span>
          </p>
        )}
        {stats.links.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">Belum ada tautan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Tautan</th>
                  <th className="py-2 pr-3 text-right font-semibold">Total klik</th>
                  <th className="py-2 pr-3 text-right font-semibold">7 hari</th>
                  <th className="py-2 text-right font-semibold">30 hari</th>
                </tr>
              </thead>
              <tbody>
                {stats.links.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100">
                    <td className="max-w-[260px] py-2 pr-3">
                      <span className="line-clamp-2 break-words">{l.title}</span>
                      {!l.is_active && <span className="text-xs text-slate-400">(nonaktif)</span>}
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold">{nf(l.clicks)}</td>
                    <td className="py-2 pr-3 text-right">{nf(l.clicks_7d)}</td>
                    <td className="py-2 text-right">{nf(l.clicks_30d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
