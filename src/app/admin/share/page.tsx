'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, ExternalLink, Facebook, Loader2, MessageCircle, Send, Share2, Twitter } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { PageSettings } from '@/lib/types';

function logShare() {
  try {
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'share' }),
      keepalive: true,
    });
  } catch {
    /* abaikan */
  }
}

export default function SharePage() {
  const [slug, setSlug] = useState<string | null>(null);
  const [name, setName] = useState('RSU Bhakti Yudha');
  const [origin, setOrigin] = useState('');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setOrigin((process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, ''));
    api<{ settings: PageSettings | null }>('/api/admin/settings')
      .then(({ settings }) => {
        if (!settings) throw new Error();
        setSlug(settings.slug);
        setName(settings.name);
      })
      .catch(() => setError('Gagal memuat data halaman publik.'));
  }, []);

  const url = slug && origin ? `${origin}/${slug}` : '';

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#14532d', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setError('Gagal membuat QR Code.'));
  }, [url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      logShare();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Salin tautan ini:', url);
    }
  }

  function downloadQr() {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `qr-${slug}.png`;
    a.click();
  }

  async function nativeShare() {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: name, url });
        logShare();
      } else await copy();
    } catch {
      /* dibatalkan */
    }
  }

  if (!url) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
        {error ? <span className="text-red-700">{error}</span> : (<><Loader2 className="animate-spin" size={20} /> Memuat...</>)}
      </div>
    );
  }

  const text = encodeURIComponent(`${name} - kumpulan tautan resmi:`);
  const u = encodeURIComponent(url);
  const targets = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${text}%20${u}`, Icon: MessageCircle, cls: 'bg-green-600 text-white hover:bg-green-700' },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: Facebook, cls: 'bg-blue-600 text-white hover:bg-blue-700' },
    { label: 'X / Twitter', href: `https://twitter.com/intent/tweet?text=${text}&url=${u}`, Icon: Twitter, cls: 'bg-slate-900 text-white hover:bg-black' },
    { label: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${text}`, Icon: Send, cls: 'bg-sky-500 text-white hover:bg-sky-600' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Bagikan Halaman</h1>
        <p className="text-sm text-slate-500">Bagikan alamat publik atau cetak QR Code untuk poster dan brosur.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-[280px_1fr]">
        <section className="card flex flex-col items-center gap-3 p-5">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`QR Code ${url}`} className="h-56 w-56 rounded-xl border border-slate-200" />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
          )}
          <button type="button" onClick={downloadQr} disabled={!qr} className="btn-primary w-full">
            <Download size={16} /> Unduh QR (PNG)
          </button>
          <p className="text-center text-xs text-slate-500">Resolusi 1024 px, siap cetak.</p>
        </section>

        <section className="card space-y-4 p-5">
          <div>
            <label htmlFor="pub-url" className="label">Alamat publik</label>
            <div className="flex gap-2">
              <input id="pub-url" readOnly value={url} className="input" onFocus={(e) => e.currentTarget.select()} />
              <button type="button" onClick={() => void copy()} className="btn-outline shrink-0">
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />} {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>
          </div>

          <div>
            <span className="label">Bagikan ke</span>
            <div className="grid grid-cols-2 gap-2">
              {targets.map(({ label, href, Icon, cls }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={logShare} className={`btn ${cls}`}>
                  <Icon size={16} /> {label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void nativeShare()} className="btn-outline">
              <Share2 size={16} /> Menu bagikan perangkat
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn-outline">
              <ExternalLink size={16} /> Buka halaman
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
