'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { AuditRow } from '@/lib/types';
import { dateTimeId } from '@/lib/format';

const ACTIONS: Record<string, string> = { INSERT: 'Menambah', UPDATE: 'Mengubah', DELETE: 'Menghapus', REORDER: 'Mengurutkan' };
const TABLES: Record<string, string> = { links: 'Tautan', site_settings: 'Pengaturan halaman', page_settings: 'Pengaturan halaman' };

function summary(r: AuditRow): string {
  const d = (r.new_data ?? r.old_data) as Record<string, unknown> | null;
  if (r.action === 'REORDER') return 'Urutan tautan diubah';
  if (!d) return '-';
  if (r.table_name === 'links') return String(d.title ?? '');
  if (r.action === 'UPDATE' && r.old_data && r.new_data) {
    const changed = Object.keys(r.new_data).filter(
      (k) => k !== 'updated_at' && JSON.stringify(r.new_data?.[k]) !== JSON.stringify(r.old_data?.[k])
    );
    return changed.length ? `Kolom: ${changed.join(', ')}` : '-';
  }
  return String(d.name ?? '');
}

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ rows: AuditRow[] }>('/api/admin/audit')
      .then((data) => setRows(data.rows))
      .catch((e: Error) => setError(`Gagal memuat riwayat: ${e.message}`))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="animate-spin" size={20} /> Memuat riwayat...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">Riwayat Perubahan</h1>
        <p className="text-sm text-slate-500">100 perubahan terakhir oleh admin (dicatat otomatis oleh server).</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-semibold">Waktu (WIB)</th>
              <th className="px-4 py-3 font-semibold">Admin</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
              <th className="px-4 py-3 font-semibold">Objek</th>
              <th className="px-4 py-3 font-semibold">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Belum ada riwayat.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 align-top">
                <td className="whitespace-nowrap px-4 py-2.5">{dateTimeId(r.created_at)}</td>
                <td className="px-4 py-2.5">{r.actor_email ?? '-'}</td>
                <td className="px-4 py-2.5">{ACTIONS[r.action] ?? r.action}</td>
                <td className="px-4 py-2.5">{TABLES[r.table_name] ?? r.table_name}</td>
                <td className="max-w-[260px] break-words px-4 py-2.5 text-slate-600">{summary(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
