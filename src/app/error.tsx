'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-bold">Terjadi gangguan</h1>
      <p className="text-sm text-slate-600">Halaman belum bisa dimuat. Silakan coba lagi.</p>
      <button type="button" className="btn-primary" onClick={reset}>Coba lagi</button>
    </main>
  );
}
