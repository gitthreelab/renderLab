import { parseRecipeMeta, type RecipeMeta } from '@render-lab/protocol';

const metaModules = import.meta.glob<unknown>('../../../../recipes/*/meta.ts', {
  eager: true,
  import: 'default',
});

export function folderName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 2] ?? '';
}

export function loadRecipes(): RecipeMeta[] {
  const recipes: RecipeMeta[] = [];

  for (const [path, module] of Object.entries(metaModules)) {
    const folder = folderName(path);
    if (folder.startsWith('_')) continue;

    const result = parseRecipeMeta(module);
    if (!result.ok) {
      throw new Error(`Receta "${folder}": ${result.error}`);
    }
    if (result.data.slug !== folder) {
      throw new Error(
        `Receta "${folder}": el slug "${result.data.slug}" no coincide con la carpeta`,
      );
    }
    if (result.data.draft) continue;

    recipes.push(result.data);
  }

  return recipes.sort((a, b) => a.order - b.order);
}

export const recipes = loadRecipes();

export function findRecipe(slug: string): RecipeMeta | undefined {
  return recipes.find((recipe) => recipe.slug === slug);
}
