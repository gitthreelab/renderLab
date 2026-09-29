import { z } from 'zod';

/** Locales soportados. Añadir un idioma = añadirlo a esta lista (P8). */
export const LOCALES = ['es'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE = 'es' satisfies Locale;

export const LocaleSchema = z.enum(LOCALES);

const TextSchema = z.string().trim().min(1);

/**
 * Texto visible indexado por locale: el locale por defecto es obligatorio y
 * los demás locales soportados son opcionales. Un locale no soportado es un error.
 */
export const LocalizedTextSchema = z.strictObject({
  ...(Object.fromEntries(LOCALES.map((locale) => [locale, TextSchema.optional()])) as Record<
    Locale,
    z.ZodOptional<typeof TextSchema>
  >),
  [DEFAULT_LOCALE]: TextSchema,
});

export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

/** Nombre del fichero de contenido de una receta para un locale: `content.<locale>.mdx`. */
export function contentFileName<L extends Locale>(locale: L): `content.${L}.mdx` {
  return `content.${locale}.mdx`;
}
