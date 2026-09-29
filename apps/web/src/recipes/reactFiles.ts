const reactSources = import.meta.glob<string>('../../../../recipes/*/react/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const filesBySlug = new Map<string, Record<string, string>>();

for (const [path, code] of Object.entries(reactSources)) {
  const parts = path.split('/');
  const reactIndex = parts.indexOf('react');
  const slug = parts[reactIndex - 1];
  if (reactIndex === -1 || !slug || slug.startsWith('_')) continue;

  const filePath = '/' + parts.slice(reactIndex + 1).join('/');
  const files = filesBySlug.get(slug) ?? {};
  files[filePath] = code;
  filesBySlug.set(slug, files);
}

export function getReactFiles(slug: string) {
  return filesBySlug.get(slug);
}
