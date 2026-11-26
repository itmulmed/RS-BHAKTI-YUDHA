import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { listLinks } from '@/lib/data/links';
import { getSettings } from '@/lib/data/settings';
import PublicPage from '@/components/PublicPage';

export const dynamic = 'force-dynamic';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

const load = cache(async (slug: string) => {
  if (!SLUG_RE.test(slug)) return null;
  const settings = await getSettings();
  if (!settings || settings.slug !== slug) return null;
  return { settings, links: await listLinks({ activeOnly: true }) };
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await load(params.slug);
  if (!data) return { title: 'Halaman tidak ditemukan' };
  const { settings } = data;
  return {
    title: settings.name,
    description: settings.description ?? undefined,
    openGraph: {
      title: settings.name,
      description: settings.description ?? undefined,
      images: settings.cover_url ? [settings.cover_url] : undefined,
      type: 'website',
    },
  };
}

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { preview?: string };
}) {
  const data = await load(params.slug);
  if (!data) notFound();
  return <PublicPage settings={data.settings} links={data.links} preview={searchParams.preview === '1'} />;
}
