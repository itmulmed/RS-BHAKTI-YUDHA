'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, ExternalLink, Link2, Loader2, Palette, Plus, Share2, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { LinkItem, PageSettings, Stats } from '@/lib/types';
import { ctr, dayShort, nf } from '@/lib/format';
import LinkEditor from '@/components/admin/LinkEditor';
import PhoneMockup from '@/components/admin/PhoneMockup';

export default function DashboardPage() {
  const [settings, setSettings] = useState<PageSettings | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState<{ link: LinkItem | null } | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const [s, l, st] = await Promise.all([
        api<{ settings: PageSettings | null }>('/api/admin/settings'),
        api<{ links: LinkItem[] }>('/api/admin/links'),
        api<{ stats: Stats }>('/api/admin/stats'),
      ]);
      setSettings(s.settings);
      setLinks(l.links);
      setStats(st.stats);
      setError('');
    } catch (e) {
      setError(`Gagal memuat data: ${(e as Error).message}`);
    }
    setPreviewKey((k) => k + 1);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const last7 = stats ? stats.daily.slice(-7) : [];
  const maxViews = Math.max(1, ...last7.map((d) => d.views));
  const totals = stats?.summary.totals;
  const topLink = stats ? [...stats.links].sort((a, b) => b.clicks_7d - a.clicks_7d)[0] : undefined;
  const activeLinks = links.filter((l) => l.is_active);
  const slug = settings?.slug ?? 'rsubhaktiyudha';

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="animate-spin" size={20} /> Memuat dashboard...
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-5">
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {/* Statistik */}
        <section className="card overflow-hidden" aria-label="Ringkasan statistik">
          <div className="grid gap-4 p-5 sm:grid-cols-[1fr_1.15fr]">
            <div className="flex flex-col justify-between gap-2">
              <p className="text-sm font-medium text-slate-600">Total Kunjungan Halaman</p>
              <p className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight">{nf(totals?.views ?? 0)}</span>
                <span className="text-sm text-slate-500">tayangan</span>
              </p>
              <p className="text-xs text-slate-500">
                {nf(totals?.visitors ?? 0)} pengunjung unik &bull; CTR rata-rata {ctr(totals?.clicks ?? 0, totals?.views ?? 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50/50 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Tren Kunjungan Harian</span>
                <span>7 Hari Terakhir</span>
              </div>
              <div className="flex h-28 items-end gap-1.5" role="img" aria-label="Grafik kunjungan 7 hari terakhir">
                {last7.map((d, i) => {
                  const isToday = i === last7.length - 1;
                  const h = Math.max(6, Math.round((d.views / maxViews) * 64));
                  return (
                    <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-[11px] font-semibold text-slate-600">{d.views}</span>
                      <div className={`w-full rounded-md ${isToday ? 'bg-green-600' : 'bg-green-200'}`} style={{ height: h }} />
                      <span className={`text-[11px] ${isToday ? 'font-bold text-slate-900' : 'text-slate-500'}`}>{dayShort(d.date)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-900">
              <TrendingUp size={16} className="mt-0.5 shrink-0" />
              {topLink && topLink.clicks_7d > 0 ? (
                <p className="min-w-0">
                  <strong>Link terpopuler:</strong> <span className="break-words">&quot;{topLink.title}&quot;</span> ({nf(topLink.clicks_7d)} klik minggu ini)
                </p>
              ) : (
                <p>Belum ada klik link minggu ini.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-slate-100 p-5">
            {[
              { label: 'Klik Link', value: totals?.clicks ?? 0 },
              { label: 'Pengunjung', value: totals?.visitors ?? 0 },
              { label: 'Dibagikan', value: totals?.shares ?? 0 },
            ].map((b) => (
              <div key={b.label} className="rounded-2xl border border-slate-200 p-3.5">
                <p className="text-xs text-slate-500 sm:text-sm">{b.label}</p>
                <p className="mt-1.5 text-2xl font-bold">{nf(b.value)}</p>
              </div>
            ))}
          </div>

          <Link href="/admin/analytics" className="flex items-center justify-center gap-2 border-t border-slate-100 py-3.5 text-sm font-semibold text-green-700 hover:bg-green-50">
            Buka Laporan Analitik Lengkap &amp; Export <ArrowRight size={16} />
          </Link>
        </section>

        {/* Daftar tautan */}
        <section className="card overflow-hidden" aria-label="Tautan aktif">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-green-50/40 px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-700"><Link2 size={14} /></span>
              Tautan Aktif ({activeLinks.length})
            </h2>
            <Link href="/admin/links" className="text-sm font-semibold text-green-700 hover:underline">
              Kelola Semua ({links.length}) &rsaquo;
            </Link>
          </div>

          {activeLinks.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">Belum ada tautan aktif. Tambahkan tautan pertama Anda.</p>
          ) : (
            <ul className="divide-y divide-slate-100 px-5">
              {activeLinks.slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.title}</p>
                    <p className="truncate text-xs text-slate-500">{l.url}</p>
                  </div>
                  <button type="button" onClick={() => setEditor({ link: l })} className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
            <button type="button" onClick={() => setEditor({ link: null })} className="flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:underline">
              <Plus size={16} /> Tambah Link Baru
            </button>
            <span className="text-xs text-slate-500">{activeLinks.length} dari {links.length} tautan tampil di publik</span>
          </div>
        </section>

        {/* Aksi cepat */}
        <section aria-label="Aksi cepat">
          <h2 className="mb-2 px-1 text-xs font-semibold text-slate-500">Aksi Cepat</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button type="button" onClick={() => setEditor({ link: null })} className="card p-4 text-left transition hover:border-green-300 hover:shadow-sm">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700"><Link2 size={18} /></span>
              <p className="text-sm font-bold">Tambah Link</p>
              <p className="text-xs text-slate-500">Tautan web &amp; dokumen</p>
            </button>
            <Link href="/admin/design" className="card p-4 transition hover:border-green-300 hover:shadow-sm">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700"><Palette size={18} /></span>
              <p className="text-sm font-bold">Ubah Desain</p>
              <p className="text-xs text-slate-500">Warna, font &amp; tema</p>
            </Link>
            <Link href="/admin/analytics" className="card p-4 transition hover:border-green-300 hover:shadow-sm">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700"><BarChart3 size={18} /></span>
              <p className="text-sm font-bold">Analitik</p>
              <p className="text-xs text-slate-500">Harian, mingguan, bulanan</p>
            </Link>
            <Link href="/admin/share" className="card p-4 transition hover:border-green-300 hover:shadow-sm">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700"><Share2 size={18} /></span>
              <p className="text-sm font-bold">Bagikan Bio</p>
              <p className="text-xs text-slate-500">QR code &amp; tautan</p>
            </Link>
          </div>
        </section>
      </div>

      {/* Pratinjau langsung */}
      <aside className="lg:sticky lg:top-20 lg:self-start" aria-label="Pratinjau halaman publik">
        <p className="mb-3 text-center text-xs font-medium text-slate-500">Pratinjau langsung</p>
        <PhoneMockup>
          <iframe key={previewKey} src={`/${slug}?preview=1`} title="Pratinjau halaman publik" className="h-full w-full border-0" />
        </PhoneMockup>
        <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-green-700 hover:underline">
          Buka di tab baru <ExternalLink size={14} />
        </a>
      </aside>

      {editor && settings && (
        <LinkEditor
          link={editor.link}
          themeColor={settings.theme_color}
          onClose={() => setEditor(null)}
          onChanged={() => void load()}
        />
      )}
    </div>
  );
}
