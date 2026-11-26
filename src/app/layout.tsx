import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter, Poppins, Montserrat, Playfair_Display, Nunito } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

function siteUrl(): URL | undefined {
  try {
    return process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined;
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: 'RSBY LinkHub',
  description: 'Halaman tautan resmi RSU Bhakti Yudha',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const vars = [jakarta, inter, poppins, montserrat, playfair, nunito].map((f) => f.variable).join(' ');
  return (
    <html lang="id" className={vars}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
