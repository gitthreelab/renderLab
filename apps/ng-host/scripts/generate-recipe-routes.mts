/**
 * Genera src/app/recipe.routes.generated.ts: una ruta lazy /ng/<slug> por
 * cada recipes/<slug>/angular/index.ts, que exporta por defecto el componente
 * raíz standalone de la receta.
 *
 * Las carpetas que empiezan por "_" son fixtures (p. ej. _smoke): tienen ruta
 * aquí, pero el loader de apps/web las excluye del listado.
 *
 * Se ejecuta antes de dev, build y typecheck. `ng serve` no vuelve a
 * ejecutarlo: una receta nueva exige reiniciar `pnpm dev`. Editar una receta
 * que ya tiene ruta no lo exige.
 */
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RECIPES_DIR = join(HOST_ROOT, '..', '..', 'recipes');
const OUT_FILE = join(HOST_ROOT, 'src', 'app', 'recipe.routes.generated.ts');

// kebab-case, con "_" inicial opcional para fixtures.
const FOLDER_PATTERN = /^_?[a-z0-9]+(?:-[a-z0-9]+)*$/;

const folders = existsSync(RECIPES_DIR)
  ? readdirSync(RECIPES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  : [];

const invalid = folders.filter((name) => !FOLDER_PATTERN.test(name));
if (invalid.length > 0) {
  console.error(`[recipe-routes] Carpetas de recipes/ fuera de kebab-case: ${invalid.join(', ')}`);
  process.exit(1);
}

const slugs = folders.filter((name) => existsSync(join(RECIPES_DIR, name, 'angular', 'index.ts')));

const importPath = (slug: string): string =>
  relative(dirname(OUT_FILE), join(RECIPES_DIR, slug, 'angular', 'index'))
    .split(sep)
    .join('/');

const routes = slugs
  .map((slug) => `  { path: '${slug}', loadComponent: () => import('${importPath(slug)}') },`)
  .join('\n');

writeFileSync(
  OUT_FILE,
  `// Generado por scripts/generate-recipe-routes.mts. No editar a mano.
import { Routes } from '@angular/router';

export const recipeRoutes: Routes = [
${routes}
];
`,
);

console.log(`[recipe-routes] ${slugs.length} ruta(s): ${slugs.join(', ') || '(ninguna)'}`);
