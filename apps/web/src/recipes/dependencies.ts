import { parseRecipePackageFor } from '@render-lab/protocol';
import { folderName } from './loader';

// recipes/<slug>/package.json es opcional: solo lo tienen las recetas cuyo código
// React importa paquetes npm además de react y react-dom.
const packageModules = import.meta.glob<unknown>('../../../../recipes/*/package.json', {
  eager: true,
  import: 'default',
});

const dependenciesBySlug = new Map<string, Record<string, string>>();

for (const [path, module] of Object.entries(packageModules)) {
  const folder = folderName(path);
  if (folder.startsWith('_')) continue;

  const result = parseRecipePackageFor(folder, module);
  if (!result.ok) {
    throw new Error(`Receta "${folder}" (package.json): ${result.error}`);
  }
  dependenciesBySlug.set(folder, result.data.dependencies);
}

/** Dependencias npm extra que la receta pide para Sandpack (vacío si no tiene package.json). */
export function getRecipeDependencies(slug: string): Record<string, string> {
  return dependenciesBySlug.get(slug) ?? {};
}
