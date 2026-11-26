import { redirect } from 'next/navigation';
import { getSettings } from '@/lib/data/settings';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let slug: string | null = null;
  try {
    slug = (await getSettings())?.slug ?? null;
  } catch (error) {
    console.error(error);
  }
  if (slug) redirect(`/${slug}`);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-bold text-slate-900">RSBY LinkHub belum siap</h1>
      <p className="text-sm text-slate-600">
        Data awal belum ditemukan. Pastikan <code>npm run db:setup</code> sudah dijalankan dan variabel
        lingkungan MongoDB sudah diisi.
      </p>
    </main>
  );
}
