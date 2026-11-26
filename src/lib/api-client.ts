/** Pemanggil API untuk komponen browser. */
export async function api<T = { ok: true }>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; form?: FormData } = {}
): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? 'GET',
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.form ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
    cache: 'no-store',
    credentials: 'same-origin',
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (res.status === 401 && path.startsWith('/api/admin')) {
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }
  if (!res.ok || !data) throw new Error(data?.error ?? `Permintaan gagal (${res.status}).`);
  return data;
}

export async function logout() {
  await api('/api/auth/logout', { method: 'POST' });
  window.location.assign('/login');
}
