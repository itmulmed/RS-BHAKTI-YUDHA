'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, History, Link2, LayoutDashboard, LogOut, Palette, Share2 } from 'lucide-react';
import { logout } from '@/lib/api-client';
import { can, type Permission, type Role } from '@/lib/auth/roles';

const ITEMS: { href: string; label: string; Icon: typeof Link2; needs?: Permission }[] = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/links', label: 'Tautan', Icon: Link2 },
  { href: '/admin/design', label: 'Desain', Icon: Palette, needs: 'settings:write' },
  { href: '/admin/analytics', label: 'Analitik', Icon: BarChart3 },
  { href: '/admin/share', label: 'Bagikan', Icon: Share2 },
  { href: '/admin/audit', label: 'Riwayat', Icon: History, needs: 'audit:read' },
];

export default function AdminNav({ email, role }: { email: string; role: Role }) {
  const pathname = usePathname() ?? '';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href="/admin" className="flex shrink-0 items-center gap-2 font-bold text-green-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
            <Link2 size={16} />
          </span>
          <span className="hidden sm:inline">RSBY LinkHub</span>
        </Link>
        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label="Menu admin">
          {ITEMS.filter((item) => !item.needs || can(role, item.needs)).map(({ href, label, Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden max-w-[160px] truncate text-xs text-slate-500 lg:inline">{email}</span>
          <button type="button" onClick={() => void logout().catch(() => window.alert('Gagal keluar. Coba lagi.'))} className="btn-outline px-3 py-2" aria-label="Keluar">
            <LogOut size={16} /> <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
