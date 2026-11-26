import { ArrowRight } from 'lucide-react';
import type { LinkItem, PageSettings } from '@/lib/types';
import { getIcon } from '@/lib/icons';
import { darken, fontFamily, pageBackground, readableText, shapeRadius } from '@/lib/theme';
import { ShareButton, ViewTracker } from './PublicClient';

interface Props {
  settings: PageSettings;
  links: LinkItem[];
  /** true = tidak mencatat statistik & tombol langsung ke URL tujuan (dipakai di pratinjau admin) */
  preview?: boolean;
  /** true = dipakai di dalam mockup HP (tinggi mengikuti wadah) */
  embedded?: boolean;
}

export default function PublicPage({ settings, links, preview = false, embedded = false }: Props) {
  const bg = pageBackground(settings.background, settings.theme_color);
  const radius = shapeRadius(settings.button_shape);
  const descColor = bg.dark ? 'rgba(236,253,245,0.85)' : '#3f6b50';
  const footColor = bg.dark ? 'rgba(236,253,245,0.7)' : '#5b7f69';

  return (
    <div
      className={embedded ? 'min-h-full' : 'min-h-screen'}
      style={{ background: bg.css, fontFamily: fontFamily(settings.font) }}
    >
      {!preview && <ViewTracker />}
      <div className="mx-auto w-full max-w-[480px]">
        <header className="relative h-[330px] overflow-hidden">
          {settings.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${darken(settings.theme_color, 0.4)}, ${settings.theme_color})` }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.6) 82%, ${bg.top} 100%)`,
            }}
          />
          <div className="absolute right-4 top-4">
            <ShareButton title={settings.name} track={!preview} />
          </div>
          <div className="absolute inset-x-0 bottom-14 flex flex-col items-center px-6 text-center">
            {settings.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt={`Logo ${settings.name}`}
                className="mb-3 h-24 w-24 rounded-full border-4 border-white bg-white object-cover shadow-lg"
              />
            )}
            <h1 className="text-2xl font-bold leading-tight text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.45)' }}>
              {settings.name}
            </h1>
          </div>
        </header>

        {settings.description && (
          <p className="px-8 pb-1 pt-1 text-center text-sm leading-relaxed" style={{ color: descColor }}>
            {settings.description}
          </p>
        )}

        {settings.banner_url && (
          <div className="px-5 pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.banner_url} alt={`Banner ${settings.name}`} className="w-full rounded-2xl" />
          </div>
        )}

        <main className="space-y-3.5 px-5 pb-6 pt-5">
          {links.length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: descColor }}>
              Belum ada tautan.
            </p>
          )}
          {links.map((link) => {
            const Icon = getIcon(link.icon);
            const color = link.color ?? settings.theme_color;
            const text = readableText(color);
            const href = preview ? link.url : `/go/${link.id}`;
            return (
              <a
                key={link.id}
                href={href}
                target={link.open_new_tab ? '_blank' : undefined}
                rel={link.open_new_tab ? 'noopener noreferrer' : undefined}
                className="pub-link flex w-full items-center gap-3 px-5 py-4 text-left font-semibold no-underline"
                style={{
                  background: color,
                  color: text,
                  borderRadius: radius,
                  boxShadow: `0 4px 0 ${darken(color, 0.28)}`,
                  border: color.toLowerCase() === '#ffffff' ? '1px solid #d1d5db' : undefined,
                }}
              >
                <Icon size={20} className="shrink-0" aria-hidden />
                <span className="line-clamp-2 min-w-0 flex-1 text-[15px] leading-snug">{link.title}</span>
                <ArrowRight size={18} className="shrink-0" aria-hidden />
              </a>
            );
          })}
        </main>

        {settings.footer && (
          <footer className="px-6 pb-10 pt-3 text-center text-xs" style={{ color: footColor }}>
            {settings.footer}
          </footer>
        )}
      </div>
    </div>
  );
}
