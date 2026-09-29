import { Sandpack, type SandpackFiles } from '@codesandbox/sandpack-react';
import probeSource from '@render-lab/probe-react/probe.js?raw';
import { getReactFiles } from '../recipes/reactFiles';

const PROBE_PATH = '/render-lab-probe.js';
const ENTRY_PATH = '/render-lab-entry.js';

const entrySource = `
import { connectToLab } from '.${PROBE_PATH}';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

connectToLab(${JSON.stringify(window.location.origin)});
createRoot(document.getElementById('root')).render(createElement(App));
`;

const sandboxFilesBySlug = new Map<string, SandpackFiles>();

function sandboxFilesFor(slug: string): SandpackFiles | undefined {
  const cached = sandboxFilesBySlug.get(slug);
  if (cached) return cached;

  const recipeFiles = getReactFiles(slug);
  if (!recipeFiles) return undefined;

  const files: SandpackFiles = {
    ...recipeFiles,
    [PROBE_PATH]: { code: probeSource, hidden: true },
    [ENTRY_PATH]: { code: entrySource, hidden: true },
  };
  sandboxFilesBySlug.set(slug, files);
  return files;
}

type ReactSandboxProps = {
  slug: string;
};

export default function ReactSandbox({ slug }: ReactSandboxProps) {
  const files = sandboxFilesFor(slug);

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