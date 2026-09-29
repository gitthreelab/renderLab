import { DEFAULT_LOCALE, contentFileName } from '@render-lab/protocol';
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { folderName } from './loader';

type MdxModule = { default: ComponentType };

const contentModules = import.meta.glob<MdxModule>('../../../../recipes/*/content.*.mdx');

export const recipeContents: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {};

for (const [path, load] of Object.entries(contentModules)) {
  const folder = folderName(path);
  const file = path.split('/').at(-1);
  if (folder.startsWith('_') || file !== contentFileName(DEFAULT_LOCALE)) continue;

  recipeContents[folder] = lazy(load);
}
