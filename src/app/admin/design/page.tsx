'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Save, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { LinkItem, PageSettings } from '@/lib/types';
import { BACKGROUND_OPTIONS, COLOR_SWATCHES, FONT_OPTIONS, SHAPE_OPTIONS } from '@/lib/theme';
import { isHexColor, validateSlug } from '@/lib/validators';
import { resizeImage } from '@/lib/image';
import PublicPage from '@/components/PublicPage';
import PhoneMockup from '@/components/admin/PhoneMockup';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];
type ImageKind = 'cover' | 'logo' | 'banner';

export default function DesignPage() {
  const [form, setForm] = useState<PageSettings | null>(null);
  const [saved, setSaved] = useState<string>('');
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<ImageKind | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([
        api<{ settings: PageSettings | null }>('/api/admin/settings'),
        api<{ links: LinkItem[] }>('/api/admin/links'),
      ]);
      setForm(s.settings);
      setSaved(JSON.stringify(s.settings));
      setLinks(l.links.filter((link) => link.is_active));
    } catch (e) {
      setError(`Gagal memuat: ${(e as Error).message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = form !== null && JSON.stringify(form) !== saved;

  function patch(p: Partial<PageSettings>) {
    setForm((f) => (f ? { ...f, ...p } : f));
    setOk('');
  }

  async function upload(kind: ImageKind, file: File | undefined) {
    if (!file) return;
    setError('');
    if (!ALLOWED.includes(file.type)) return setError('Format gambar harus PNG, JPG, atau WebP.');
    if (file.size > 15 * 1024 * 1024) return setError('Ukuran file terlalu besar (maksimal 15 MB).');
    setUploading(kind);
    try {
      const { blob, ext } = await resizeImage(file, kind === 'logo' ? 600 : 1600, kind !== 'logo');
      const body = new FormData();
      body.append('kind', kind);
      body.append('file', blob, `${kind}.${ext}`);
      const { url } = await api<{ url: string }>('/api/admin/upload', { method: 'POST', form: body });
      patch({ [`${kind}_url`]: url });
    } catch (e) {
      setError(`Gagal mengunggah gambar: ${(e as Error).message}`);
    } finally {
      setUploading(null);
      if (coverRef.current) coverRef.current.value = '';
      if (logoRef.current) logoRef.current.value = '';
      if (bannerRef.current) bannerRef.current.value = '';
    }
  }

  async function save() {
    if (!form) return;
    setError('');
    setOk('');
    const name = form.name.trim();
    if (!name) return setError('Nama rumah sakit wajib diisi.');
    if (name.length > 80) return setError('Nama maksimal 80 karakter.');
    if ((form.description ?? '').length > 300) return setError('Deskripsi maksimal 300 karakter.');
    if ((form.footer ?? '').length > 200) return setError('Footer maksimal 200 karakter.');
    if (!isHexColor(form.theme_color)) return setError('Warna tema tidak valid.');
    const slug = form.slug.trim().toLowerCase();
    const slugErr = validateSlug(slug);
    if (slugErr) return setError(slugErr);

    setBusy(true);
    try {
      await api('/api/admin/settings', {
        method: 'PUT',
        body: {
          slug,
          name,
          description: form.description?.trim() || null,
          cover_url: form.cover_url,
          logo_url: form.logo_url,
          banner_url: form.banner_url,
          theme_color: form.theme_color,
          font: form.font,
          background: form.background,
          button_shape: form.button_shape,
          footer: form.footer?.trim() || null,
        },
      });
    } catch (e) {
      setBusy(false);
      return setError(`Gagal menyimpan: ${(e as Error).message}`);
    }
    setBusy(false);
    setOk('Tersimpan. Perubahan sudah tampil di halaman publik.');
    await load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="animate-spin" size={20} /> Memuat pengaturan...
      </div>
    );
  }
  if (!form) {
    return <p className="card p-6 text-sm text-red-700">{error || 'Data pengaturan belum ada. Jalankan "npm run db:setup" terlebih dahulu.'}</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-5">
        <div>
          <h1 className="text-xl font-bold">Desain Halaman Publik</h1>
          <p className="text-sm text-slate-500">Pratinjau di samping berubah langsung. Klik &quot;Simpan&quot; agar tampil di halaman publik.</p>
        </div>

        <section className="card space-y-4 p-5">
          <h2 className="font-bold">Identitas</h2>
          <div>
            <label htmlFor="d-name" className="label">Nama rumah sakit</label>
            <input id="d-name" className="input" value={form.name} maxLength={80} onChange={(e) => patch({ name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="d-desc" className="label">Deskripsi</label>
            <textarea id="d-desc" className="input min-h-[84px]" value={form.description ?? ''} maxLength={300} onChange={(e) => patch({ description: e.target.value })} />
          </div>
          <div>
            <label htmlFor="d-slug" className="label">Alamat halaman publik</label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-slate-500">/</span>
              <input id="d-slug" className="input" value={form.slug} maxLength={40} onChange={(e) => patch({ slug: e.target.value.toLowerCase() })} />
            </div>
            {form.slug !== (JSON.parse(saved) as PageSettings | null)?.slug && (
              <p className="mt-1 text-xs text-amber-700">Mengganti alamat akan mengubah URL dan QR Code. Cetak ulang QR jika sudah dipasang.</p>
            )}
          </div>
          <div>
            <label htmlFor="d-footer" className="label">Footer</label>
            <input id="d-footer" className="input" value={form.footer ?? ''} maxLength={200} onChange={(e) => patch({ footer: e.target.value })} />
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-bold">Gambar</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              { kind: 'cover', title: 'Foto cover', url: form.cover_url, ref: coverRef },
              { kind: 'logo', title: 'Logo', url: form.logo_url, ref: logoRef },
              { kind: 'banner', title: 'Gambar banner (opsional)', url: form.banner_url, ref: bannerRef },
            ] as const).map((item) => (
              <div key={item.kind}>
                <span className="label">{item.title}</span>
                <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                  {item.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.title} className={item.kind === 'logo' ? 'h-24 w-24 rounded-full object-cover' : 'h-full w-full object-cover'} />
                  ) : (
                    <span className="text-xs text-slate-400">Belum ada gambar</span>
                  )}
                </div>
                <input ref={item.ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void upload(item.kind, e.target.files?.[0])} />
                <div className="mt-2 flex gap-2">
                  <button type="button" className="btn-outline flex-1" disabled={uploading !== null} onClick={() => item.ref.current?.click()}>
                    {uploading === item.kind ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />} {item.url ? 'Ganti' : 'Unggah'}
                  </button>
                  {item.url && (
                    <button type="button" className="btn-danger px-3" aria-label={`Hapus ${item.title}`} onClick={() => patch({ [`${item.kind}_url`]: null })}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">PNG/JPG/WebP. Gambar otomatis dikecilkan agar halaman cepat dibuka.</p>
        </section>

        <section className="card space-y-5 p-5">
          <h2 className="font-bold">Tampilan</h2>
          <div>
            <span className="label">Warna tema</span>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button key={c} type="button" aria-label={`Warna ${c}`} aria-pressed={form.theme_color.toLowerCase() === c} onClick={() => patch({ theme_color: c })}
                  className={`h-8 w-8 rounded-full border-2 ${form.theme_color.toLowerCase() === c ? 'border-slate-900' : 'border-slate-200'}`} style={{ background: c }} />
              ))}
              <input type="color" aria-label="Pilih warna sendiri" value={isHexColor(form.theme_color) ? form.theme_color : '#16a34a'} onChange={(e) => patch({ theme_color: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5" />
            </div>
          </div>

          <div>
            <span className="label">Jenis font</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FONT_OPTIONS.map((f) => (
                <button key={f.key} type="button" aria-pressed={form.font === f.key} onClick={() => patch({ font: f.key })}
                  className={`rounded-xl border px-3 py-2.5 text-sm ${form.font === f.key ? 'border-green-600 bg-green-50 font-semibold text-green-800' : 'border-slate-200 hover:bg-slate-50'}`}
                  style={{ fontFamily: f.css }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label">Background</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BACKGROUND_OPTIONS.map((b) => (
                <button key={b.key} type="button" aria-pressed={form.background === b.key} onClick={() => patch({ background: b.key })}
                  className={`rounded-xl border px-3 py-2.5 text-sm ${form.background === b.key ? 'border-green-600 bg-green-50 font-semibold text-green-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label">Bentuk tombol</span>
            <div className="grid grid-cols-3 gap-2">
              {SHAPE_OPTIONS.map((s) => (
                <button key={s.key} type="button" aria-pressed={form.button_shape === s.key} onClick={() => patch({ button_shape: s.key })}
                  className={`border px-3 py-2.5 text-sm ${form.button_shape === s.key ? 'border-green-600 bg-green-50 font-semibold text-green-800' : 'border-slate-200 hover:bg-slate-50'}`}
                  style={{ borderRadius: s.radius }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {ok && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{ok}</p>}

        <div className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <span className="text-sm text-slate-500">{dirty ? 'Ada perubahan yang belum disimpan' : 'Semua perubahan tersimpan'}</span>
          <button type="button" className="btn-primary" disabled={busy || !dirty || uploading !== null} onClick={() => void save()}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start" aria-label="Pratinjau">
        <p className="mb-3 text-center text-xs font-medium text-slate-500">Pratinjau langsung</p>
        <PhoneMockup>
          <PublicPage settings={form} links={links} preview embedded />
        </PhoneMockup>
      </aside>
    </div>
  );
}
