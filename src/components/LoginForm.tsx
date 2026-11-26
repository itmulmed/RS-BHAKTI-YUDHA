'use client';

import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { api } from '@/lib/api-client';
import { safeAdminPath } from '@/lib/request';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      await api('/api/auth/login', { method: 'POST', body: { email: email.trim(), password } });
    } catch (err) {
      setLoading(false);
      setError((err as Error).message);
      return;
    }
    // Navigasi penuh agar tidak memakai cache router sebelum login
    window.location.assign(safeAdminPath(new URLSearchParams(window.location.search).get('next')));
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4 p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <Lock size={22} />
          </span>
          <h1 className="text-xl font-bold">Masuk Admin</h1>
          <p className="text-sm text-slate-500">RSBY LinkHub - RSU Bhakti Yudha</p>
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password" className="label">Kata sandi</label>
          <input id="password" type="password" autoComplete="current-password" className="input" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 size={16} className="animate-spin" />} Masuk
        </button>
      </form>
    </main>
  );
}
