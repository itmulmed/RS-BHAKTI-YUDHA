export const FONT_OPTIONS = [
  { key: 'poppins', label: 'Poppins', css: 'var(--font-poppins), system-ui, sans-serif' },
  { key: 'inter', label: 'Inter', css: 'var(--font-inter), system-ui, sans-serif' },
  { key: 'montserrat', label: 'Montserrat', css: 'var(--font-montserrat), system-ui, sans-serif' },
  { key: 'nunito', label: 'Nunito', css: 'var(--font-nunito), system-ui, sans-serif' },
  { key: 'playfair', label: 'Playfair Display', css: 'var(--font-playfair), Georgia, serif' },
] as const;

export const BACKGROUND_OPTIONS = [
  { key: 'soft', label: 'Hijau lembut' },
  { key: 'white', label: 'Putih' },
  { key: 'gradient', label: 'Gradasi tema' },
  { key: 'dark', label: 'Hijau gelap' },
] as const;

export const SHAPE_OPTIONS = [
  { key: 'rounded', label: 'Membulat', radius: '16px' },
  { key: 'pill', label: 'Kapsul', radius: '9999px' },
  { key: 'square', label: 'Kotak', radius: '6px' },
] as const;

export const COLOR_SWATCHES = [
  '#16a34a', '#15803d', '#166534', '#0d9488', '#2563eb', '#7c3aed',
  '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#374151', '#ffffff',
];

export function fontFamily(key: string): string {
  return (FONT_OPTIONS.find((f) => f.key === key) ?? FONT_OPTIONS[0]).css;
}

export function shapeRadius(key: string): string {
  return (SHAPE_OPTIONS.find((s) => s.key === key) ?? SHAPE_OPTIONS[0]).radius;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.slice(1) : '16a34a';
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex(rgb: [number, number, number]): string {
  return '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

/** Campur warna dengan hitam (amt 0-1) */
export function darken(hex: string, amt = 0.25): string {
  const [r, g, b] = hexToRgb(hex);
  return toHex([r * (1 - amt), g * (1 - amt), b * (1 - amt)]);
}

/** Campur warna dengan putih (amt 0-1) */
export function lighten(hex: string, amt = 0.8): string {
  const [r, g, b] = hexToRgb(hex);
  return toHex([r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt]);
}

/** Warna teks (gelap/terang) yang terbaca di atas warna latar tertentu */
export function readableText(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#14532d' : '#ffffff';
}

export function pageBackground(bg: string, theme: string): { css: string; top: string; dark: boolean } {
  let top = '#e6f4ea';
  let bottom = '#f6fbf8';
  let dark = false;
  if (bg === 'white') {
    top = '#ffffff';
    bottom = '#ffffff';
  } else if (bg === 'gradient') {
    top = lighten(theme, 0.82);
    bottom = '#ffffff';
  } else if (bg === 'dark') {
    top = '#0f3d26';
    bottom = '#072616';
    dark = true;
  }
  return { css: `linear-gradient(180deg, ${top} 0px, ${top} 320px, ${bottom} 900px, ${bottom} 100%)`, top, dark };
}
