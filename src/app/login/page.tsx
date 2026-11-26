import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Masuk Admin - RSBY LinkHub', robots: { index: false, follow: false } };

export default async function LoginPage() {
  // Kegagalan database tidak boleh menyembunyikan formulir masuk
  const session = await getSession().catch((error: unknown) => {
    console.error(error);
    return null;
  });
  if (session?.role) redirect('/admin');
  return <LoginForm />;
}
