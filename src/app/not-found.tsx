import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-bold text-green-700">404</p>
      <p className="text-slate-600">Halaman tidak ditemukan.</p>
      <Link href="/" className="btn-primary">Kembali ke beranda</Link>
    </main>
  );
}
