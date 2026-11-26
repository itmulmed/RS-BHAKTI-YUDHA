import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import AdminNav from '@/components/admin/AdminNav';
import SignOutButton from '@/components/admin/SignOutButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin - RSBY LinkHub', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!session.role) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-bold">Akses ditolak</h1>
        <p className="text-sm text-slate-600">
          Akun <strong>{session.email}</strong> tidak terdaftar sebagai admin.
        </p>
        <SignOutButton label="Keluar dan masuk dengan akun lain" />
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminNav email={session.email} role={session.role} />
      <div className="mx-auto max-w-6xl px-4 py-5">{children}</div>
    </div>
  );
}
