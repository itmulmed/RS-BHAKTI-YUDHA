'use client';

import { logout } from '@/lib/api-client';

export default function SignOutButton({ label = 'Keluar' }: { label?: string }) {
  return (
    <button
      type="button"
      className="btn-outline"
      onClick={() => void logout().catch(() => window.alert('Gagal keluar. Coba lagi.'))}
    >
      {label}
    </button>
  );
}
