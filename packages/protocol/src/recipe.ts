import { z } from 'zod';
import { LocalizedTextSchema } from './locales';

/** kebab-case: minúsculas y dígitos separados por guiones simples. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Contenido de `recipes/<slug>/meta.ts`. */
export const RecipeMetaSchema = z.strictObject({
  slug: z.string().regex(SLUG_PATTERN, 'El slug debe estar en kebab-case (a-z, 0-9 y guiones)'),
  /** Posición en el listado (orden ascendente). */
  order: z.int().positive(),
  title: LocalizedTextSchema,
  summary: LocalizedTextSchema,
  /** `true` oculta la receta del listado mientras está a medias. */
  draft: z.boolean().optional(),
});

export type RecipeMeta = z.infer<typeof RecipeMetaSchema>;

/**
 * Helper de identidad para escribir `meta.ts` con autocompletado y
 * comprobación de tipos. La validación en runtime la hace el loader.
 */
export function defineRecipe(meta: RecipeMeta): RecipeMeta {
  return meta;
}
