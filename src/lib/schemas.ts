import { z } from 'zod';
import { ICON_KEYS } from './icon-keys';
import { BACKGROUND_OPTIONS, FONT_OPTIONS, SHAPE_OPTIONS } from './theme';
import { isHexColor, normalizeUrl, validateSlug } from './validators';

const keys = (list: readonly { key: string }[]) => list.map((i) => i.key);
const oneOf = (allowed: readonly string[], message: string) =>
  z.string().refine((v) => allowed.includes(v), message);

const color = z.string().refine(isHexColor, 'Warna tidak valid.');

const optionalText = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} maksimal ${max} karakter.`)
    .nullable()
    .transform((v) => v?.trim() || null);

const imageUrl = z
  .string()
  .max(2048)
  .refine((v) => /^https?:\/\/\S+$/i.test(v), 'Alamat gambar tidak valid.')
  .nullable();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().min(3).max(254).email('Email tidak valid.'),
    // bcrypt hanya memakai 72 byte pertama
    password: z.string().min(1, 'Kata sandi wajib diisi.').max(72, 'Kata sandi terlalu panjang.'),
  })
  .strict();

export const settingsSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .superRefine((v, ctx) => {
        const message = validateSlug(v);
        if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }),
    name: z.string().trim().min(1, 'Nama rumah sakit wajib diisi.').max(80, 'Nama maksimal 80 karakter.'),
    description: optionalText(300, 'Deskripsi'),
    cover_url: imageUrl,
    logo_url: imageUrl,
    banner_url: imageUrl,
    theme_color: color,
    font: oneOf(keys(FONT_OPTIONS), 'Font tidak valid.'),
    background: oneOf(keys(BACKGROUND_OPTIONS), 'Background tidak valid.'),
    button_shape: oneOf(keys(SHAPE_OPTIONS), 'Bentuk tombol tidak valid.'),
    footer: optionalText(200, 'Footer'),
  })
  .strict();

const linkFields = {
  title: z.string().trim().min(1, 'Judul wajib diisi.').max(120, 'Judul maksimal 120 karakter.'),
  url: z
    .string()
    .max(2048)
    .transform((v, ctx) => {
      const url = normalizeUrl(v);
      if (!url || url.length > 2048) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'URL tidak valid. Gunakan alamat http/https.' });
        return z.NEVER;
      }
      return url;
    }),
  icon: oneOf(ICON_KEYS, 'Ikon tidak valid.'),
  color: color.nullable(),
  open_new_tab: z.boolean(),
  is_active: z.boolean(),
};

export const linkCreateSchema = z.object(linkFields).strict();

export const linkUpdateSchema = z
  .object(linkFields)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Tidak ada perubahan.');

export const linkOrderSchema = z
  .object({
    ids: z
      .array(z.string().uuid('ID tautan tidak valid.'))
      .min(1)
      .max(200)
      .refine((v) => new Set(v).size === v.length, 'ID tautan duplikat.'),
  })
  .strict();

export const trackSchema = z.object({ type: z.enum(['view', 'share']) }).strict();

export type SettingsInput = z.output<typeof settingsSchema>;
export type LinkCreateInput = z.output<typeof linkCreateSchema>;
export type LinkUpdateInput = z.output<typeof linkUpdateSchema>;
