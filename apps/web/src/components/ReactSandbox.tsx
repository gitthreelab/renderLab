import { Sandpack, type SandpackFiles } from '@codesandbox/sandpack-react';
import probeSource from '@render-lab/probe-react/probe.js?raw';
import { getReactFiles } from '../recipes/reactFiles';

const PROBE_PATH = '/render-lab-probe.js';
const ENTRY_PATH = '/render-lab-entry.js';

function entrySourceFor(strictMode: boolean): string {
  return `
import { connectToLab } from '.${PROBE_PATH}';
import { StrictMode, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

connectToLab(${JSON.stringify(window.location.origin)});
const app = createElement(App);
createRoot(document.getElementById('root')).render(
  ${strictMode} ? createElement(StrictMode, null, app) : app,
);
`;
}

const sandboxFilesCache = new Map<string, SandpackFiles>();

function sandboxFilesFor(slug: string, strictMode: boolean): SandpackFiles | undefined {
  const cacheKey = `${slug}|${strictMode}`;
  const cached = sandboxFilesCache.get(cacheKey);
  if (cached) return cached;

  const recipeFiles = getReactFiles(slug);
  if (!recipeFiles) return undefined;

  const files: SandpackFiles = {
    ...recipeFiles,
    [PROBE_PATH]: { code: probeSource, hidden: true },
    [ENTRY_PATH]: { code: entrySourceFor(strictMode), hidden: true },
  };
  sandboxFilesCache.set(cacheKey, files);
  return files;
}

type ReactSandboxProps = {
  slug: string;
  strictMode: boolean;
};

export default function ReactSandbox({ slug, strictMode }: ReactSandboxProps) {
  const files = sandboxFilesFor(slug, strictMode);

  if (!files) return <p>Esta receta todavía no tiene parte React.</p>;

  return (
    <Sandpack
      template="react-ts"
      files={files}
      customSetup={{
        entry: ENTRY_PATH,
        dependencies: { react: '19.2.8', 'react-dom': '19.2.8' },
      }}
      options={{ showConsole: true }}
    />
  );
}