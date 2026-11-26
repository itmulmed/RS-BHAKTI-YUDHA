'use client';

import { useState } from 'react';
import { Loader2, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { LinkItem } from '@/lib/types';
import { ICONS } from '@/lib/icons';
import { COLOR_SWATCHES } from '@/lib/theme';
import { isHexColor, normalizeUrl } from '@/lib/validators';

interface Props {
  link: LinkItem | null; // null = tambah baru
  themeColor: string;
  onClose: () => void;
  onChanged: () => void;
}

export default function LinkEditor({ link, themeColor, onClose, onChanged }: Props) {
  const [title, setTitle] = useState(link?.title ?? '');
  const [url, setUrl] = useState(link?.url ?? '');
  const [icon, setIcon] = useState(link?.icon ?? 'link');
  const [color, setColor] = useState<string | null>(link?.color ?? null);
  const [newTab, setNewTab] = useState(link?.open_new_tab ?? true);
  const [active, setActive] = useState(link?.is_active ?? true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const t = title.trim();
    if (!t) return setError('Judul wajib diisi.');
    if (t.length > 120) return setError('Judul maksimal 120 karakter.');
    const cleanUrl = normalizeUrl(url);
    if (!cleanUrl) return setError('URL tidak valid. Gunakan alamat lengkap, contoh: https://contoh.com/halaman');
    if (color && !isHexColor(color)) return setError('Warna tombol tidak valid.');

    setBusy(true);
    const payload = {
      title: t,
      url: cleanUrl,
      icon,
      color,
      open_new_tab: newTab,
      is_active: active,
    };
    try {
      if (link) await api(`/api/admin/links/${link.id}`, { method: 'PATCH', body: payload });
      else await api('/api/admin/links', { method: 'POST', body: payload });
    } catch (err) {
      setBusy(false);
      return setError(`Gagal menyimpan: ${(err as Error).message}`);
    }
    setBusy(false);
    onChanged();
    onClose();
  }

  async function remove() {
    if (!link) return;
    if (!window.confirm(`Hapus tautan "${link.title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusy(true);
    try {
      await api(`/api/admin/links/${link.id}`, { method: 'DELETE' });
    } catch (err) {
      setBusy(false);
      return setError(`Gagal menghapus: ${(err as Error).message}`);
    }
    setBusy(false);
    onChanged();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={link ? 'Edit tautan' : 'Tambah tautan'}>
      <form onSubmit={save} className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold">{link ? 'Edit Tautan' : 'Tambah Tautan Baru'}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label htmlFor="le-title" className="label">Judul tombol</label>
            <input id="le-title" className="input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Jadwal Dokter" autoFocus />
          </div>
          <div>
            <label htmlFor="le-url" className="label">Alamat tujuan (URL)</label>
            <input id="le-url" className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." inputMode="url" autoCapitalize="none" />
            <p className="mt-1 text-xs text-slate-500">Hanya http/https. Untuk WhatsApp pakai https://wa.me/628xxxxxxxxxx</p>
          </div>

          <div>
            <span className="label">Ikon</span>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {ICONS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={icon === key}
                  onClick={() => setIcon(key)}
                  className={`flex h-10 items-center justify-center rounded-xl border transition ${
                    icon === key ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label">Warna tombol</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setColor(null)}
                aria-pressed={color === null}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${color === null ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}
              >
                Ikuti tema
              </button>
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Warna ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-slate-900' : 'border-slate-200'}`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                aria-label="Pilih warna sendiri"
                value={color && isHexColor(color) ? color : themeColor}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
            <input type="checkbox" className="h-4 w-4 accent-green-600" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} />
            <span className="text-sm font-medium">Buka di tab baru</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
            <input type="checkbox" className="h-4 w-4 accent-green-600" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span className="text-sm font-medium">Tampilkan di halaman publik (aktif)</span>
          </label>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 px-5 py-4">
          {link && (
            <button type="button" onClick={remove} disabled={busy} className="btn-danger">
              <Trash2 size={16} /> Hapus
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className="btn-outline" disabled={busy}>Batal</button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy && <Loader2 size={16} className="animate-spin" />} Simpan
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
