'use client';

import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';

function logEvent(type: 'view' | 'share') {
  try {
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
      keepalive: true,
    });
  } catch {
    /* statistik tidak boleh mengganggu pengunjung */
  }
}

/** Mencatat 1 kunjungan halaman. Refresh berulang di-dedupe oleh server (30 menit). */
export function ViewTracker() {
  useEffect(() => {
    logEvent('view');
  }, []);
  return null;
}

export function ShareButton({ title, track }: { title: string; track: boolean }) {
  const [msg, setMsg] = useState('');

  async function onShare() {
    const url = window.location.origin + window.location.pathname;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url });
        if (track) logEvent('share');
        return;
      }
      await navigator.clipboard.writeText(url);
      setMsg('Tautan disalin');
      if (track) logEvent('share');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return; // pengguna membatalkan
      setMsg('Salin tautan dari bilah alamat');
      setTimeout(() => setMsg(''), 2500);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onShare}
        aria-label="Bagikan halaman"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        <Share2 size={18} />
      </button>
      {msg && (
        <span
          role="status"
          className="absolute right-0 top-12 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg"
        >
          {msg}
        </span>
      )}
    </div>
  );
}
