'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, GripVertical, Loader2, Pencil, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { LinkItem, PageSettings } from '@/lib/types';
import { getIcon } from '@/lib/icons';
import LinkEditor from '@/components/admin/LinkEditor';

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [settings, setSettings] = useState<PageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState<{ link: LinkItem | null } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([
        api<{ links: LinkItem[] }>('/api/admin/links'),
        api<{ settings: PageSettings | null }>('/api/admin/settings'),
      ]);
      setLinks(l.links);
      setSettings(s.settings);
      setError('');
    } catch (e) {
      setError(`Gagal memuat: ${(e as Error).message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function persistOrder(next: LinkItem[]) {
    if (saving) return; // hindari dua penyimpanan urutan yang saling menimpa
    setLinks(next);
    setSaving(true);
    try {
      await api('/api/admin/links/order', { method: 'PUT', body: { ids: next.map((l) => l.id) } });
      setError('');
    } catch (e) {
      setError(`Gagal menyimpan urutan: ${(e as Error).message}`);
      void load();
    }
    setSaving(false);
  }

  function move(fromId: string, toId: string) {
    if (fromId === toId) return;
    const from = links.findIndex((l) => l.id === fromId);
    const to = links.findIndex((l) => l.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...links];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void persistOrder(next);
  }

  function shift(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    void persistOrder(next);
  }

  async function toggle(l: LinkItem) {
    try {
      await api(`/api/admin/links/${l.id}`, { method: 'PATCH', body: { is_active: !l.is_active } });
      setLinks((prev) => prev.map((x) => (x.id === l.id ? { ...x, is_active: !l.is_active } : x)));
      setError('');
    } catch (e) {
      setError(`Gagal mengubah status: ${(e as Error).message}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="animate-spin" size={20} /> Memuat tautan...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Kelola Tautan</h1>
          <p className="text-sm text-slate-500">Seret ikon &#8942;&#8942; atau gunakan tombol panah untuk mengubah urutan. {saving && 'Menyimpan urutan...'}</p>
        </div>
        <button type="button" onClick={() => setEditor({ link: null })} className="btn-primary" disabled={!settings}>
          <Plus size={16} /> Tambah Link Baru
        </button>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {links.length === 0 ? (
        <div className="card px-5 py-12 text-center text-sm text-slate-500">Belum ada tautan. Klik &quot;Tambah Link Baru&quot; untuk memulai.</div>
      ) : (
        <ul className="space-y-2.5">
          {links.map((l, i) => {
            const Icon = getIcon(l.icon);
            return (
              <li
                key={l.id}
                draggable
                onDragStart={(e) => {
                  setDragId(l.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overId !== l.id) setOverId(l.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId) move(dragId, l.id);
                  setDragId(null);
                  setOverId(null);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                className={`card flex items-center gap-2.5 p-3 transition ${dragId === l.id ? 'opacity-40' : ''} ${
                  overId === l.id && dragId && dragId !== l.id ? 'border-green-500 ring-2 ring-green-500/30' : ''
                } ${l.is_active ? '' : 'bg-slate-50'}`}
              >
                <span className="hidden cursor-grab text-slate-400 active:cursor-grabbing sm:block" aria-hidden title="Seret untuk mengurutkan">
                  <GripVertical size={18} />
                </span>
                <div className="flex shrink-0 flex-col">
                  <button type="button" onClick={() => shift(i, -1)} disabled={i === 0} aria-label={`Naikkan ${l.title}`} className="rounded p-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" onClick={() => shift(i, 1)} disabled={i === links.length - 1} aria-label={`Turunkan ${l.title}`} className="rounded p-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                    <ArrowDown size={15} />
                  </button>
                </div>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: l.color ?? settings?.theme_color ?? '#16a34a', border: (l.color ?? '').toLowerCase() === '#ffffff' ? '1px solid #d1d5db' : undefined, color: (l.color ?? '').toLowerCase() === '#ffffff' ? '#14532d' : '#fff' }}
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${l.is_active ? '' : 'text-slate-500'}`}>{l.title}</p>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 truncate text-xs text-slate-500 hover:text-green-700">
                    <span className="truncate">{l.url}</span> <ExternalLink size={11} className="shrink-0" />
                  </a>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={l.is_active}
                  aria-label={l.is_active ? `Nonaktifkan ${l.title}` : `Aktifkan ${l.title}`}
                  onClick={() => void toggle(l)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${l.is_active ? 'bg-green-600' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${l.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
                <button type="button" onClick={() => setEditor({ link: l })} className="btn-outline shrink-0 px-3 py-2" aria-label={`Edit ${l.title}`}>
                  <Pencil size={14} /> <span className="hidden sm:inline">Edit</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

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
