import { z } from 'zod';

/**
 * Dependencias que fija el lab en Sandpack (§6: versión exacta, revalidación de
 * sondas al cambiarlas). Una receta NO puede declararlas.
 */
export const LAB_DEPENDENCIES = ['react', 'react-dom'] as const;

/** Versión exacta de semver: sin `^`, `~`, rangos, tags ni protocolos. */
export const EXACT_VERSION_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/** Nombre de paquete npm, con scope opcional. */
const PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

const isLabDependency = (name: string): boolean =>
  (LAB_DEPENDENCIES as readonly string[]).includes(name);

/** Nombre que debe tener el `package.json` de `recipes/<slug>/`. */
export function recipePackageName(slug: string): string {
  return `@render-lab/recipe-${slug}`;
}

/**
 * Contenido de `recipes/<slug>/package.json`: las dependencias npm extra que el
 * código React de la receta importa. Entra en el workspace de pnpm (typecheck)
 * y el lab las pasa a Sandpack junto a las suyas.
 */
export const RecipePackageSchema = z.strictObject({
  name: z.string(),
  private: z.literal(true, 'La receta debe tener "private": true'),
  dependencies: z
    .record(
      z.string(),
      z
        .string()
        .regex(
          EXACT_VERSION_PATTERN,
          'La versión debe ser exacta (p. ej. "5.0.15"), sin ^, ~ ni rangos',
        ),
    )
    // Las claves se comprueban aquí y no en el schema del record: Zod resume los
    // fallos de clave como «Invalid key in record» y se perdería el motivo.
    .superRefine((dependencies, ctx) => {
      for (const name of Object.keys(dependencies)) {
        if (isLabDependency(name)) {
          ctx.addIssue({
            code: 'custom',
            path: [name],
            message: `"${name}" no puede declararse en una receta: su versión la fija el lab (${LAB_DEPENDENCIES.join(', ')})`,
          });
        } else if (!PACKAGE_NAME_PATTERN.test(name)) {
          ctx.addIssue({
            code: 'custom',
            path: [name],
            message: `"${name}" no es un nombre de paquete npm válido`,
          });
        }
      }
    }),
});

export type RecipePackage = z.infer<typeof RecipePackageSchema>;
