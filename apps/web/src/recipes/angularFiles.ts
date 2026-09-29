// Código Angular de cada receta (recipes/<slug>/angular/**), como texto, para
// mostrarlo en solo lectura junto al iframe. Se carga en diferido: el glob no es
// eager, así que ningún fichero viaja hasta que el lector abre el código.

const angularSources = import.meta.glob<string>('../../../../recipes/*/angular/**/*.ts', {
  query: '?raw',
  import: 'default',
});

export type SourceFile = { path: string; code: string };

type Loader = { path: string; load: () => Promise<string> };

const loadersBySlug = new Map<string, Loader[]>();

for (const [modulePath, load] of Object.entries(angularSources)) {
  const parts = modulePath.split('/');
  const angularIndex = parts.indexOf('angular');
  const slug = parts[angularIndex - 1];
  if (angularIndex === -1 || !slug || slug.startsWith('_')) continue;

  const loaders = loadersBySlug.get(slug) ?? [];
  loaders.push({ path: parts.slice(angularIndex + 1).join('/'), load });
  loadersBySlug.set(slug, loaders);
}

// index.ts (la raíz de la receta) primero; el resto, por nombre.
function byPath(a: Loader, b: Loader): number {
  if (a.path === 'index.ts') return -1;
  if (b.path === 'index.ts') return 1;
  return a.path.localeCompare(b.path);
}

const filesCache = new Map<string, Promise<SourceFile[]>>();

/** Promesa estable por receta, pensada para `use()`: se crea una vez y se reutiliza. */
export function getAngularFiles(slug: string): Promise<SourceFile[]> {
  let files = filesCache.get(slug);
  if (!files) {
    const loaders = [...(loadersBySlug.get(slug) ?? [])].sort(byPath);
    files = Promise.all(loaders.map(async ({ path, load }) => ({ path, code: await load() })));
    filesCache.set(slug, files);
  }
  return files;
}
