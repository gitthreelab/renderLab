import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  SandpackStack,
  useSandpack,
  type SandpackFiles,
} from '@codesandbox/sandpack-react';
import probeSource from '@render-lab/probe-react/probe.js?raw';
import { use, useDeferredValue, useEffect, useMemo } from 'react';
import type * as ReactCompiler from '../lab/reactCompiler';
import { getReactFiles } from '../recipes/reactFiles';

const PROBE_PATH = '/render-lab-probe.js';
const ENTRY_PATH = '/render-lab-entry.js';
// Espejo oculto con la salida del React Compiler. Repite la estructura de la
// receta, así que los imports relativos entre sus ficheros siguen valiendo.
const COMPILED_DIR = '/__compiled__';

type Compiler = typeof ReactCompiler;
type CompilerLoad = { ok: true; compiler: Compiler } | { ok: false; error: string };

let compilerLoad: Promise<CompilerLoad> | undefined;

// import() solo se ejecuta al activar el toggle: Vite deja el compiler en su
// propio chunk y, con el toggle apagado, no se descarga nada de él.
function loadReactCompiler(): Promise<CompilerLoad> {
  compilerLoad ??= import('../lab/reactCompiler').then(
    (compiler): CompilerLoad => ({ ok: true, compiler }),
    (error: unknown): CompilerLoad => ({ ok: false, error: String(error) }),
  );
  return compilerLoad;
}

function entrySourceFor(strictMode: boolean, appImport: string): string {
  return `
import { connectToLab } from '.${PROBE_PATH}';
import { StrictMode, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '${appImport}';

connectToLab(${JSON.stringify(window.location.origin)});
const app = createElement(App);
createRoot(document.getElementById('root')).render(
  ${strictMode} ? createElement(StrictMode, null, app) : app,
);
`;
}

function compiledMirrorFiles(compiled: Record<string, string>): SandpackFiles {
  const files: SandpackFiles = {};
  for (const [path, code] of Object.entries(compiled)) {
    files[`${COMPILED_DIR}${path}`] = { code, hidden: true };
  }
  return files;
}

const sandboxFilesCache = new Map<string, SandpackFiles>();

function sandboxFilesFor(
  slug: string,
  strictMode: boolean,
  compiler: Compiler | null,
): SandpackFiles | undefined {
  const cacheKey = `${slug}|${strictMode}|${compiler !== null}`;
  const cached = sandboxFilesCache.get(cacheKey);
  if (cached) return cached;

  const recipeFiles = getReactFiles(slug);
  if (!recipeFiles) return undefined;

  const files: SandpackFiles = {
    ...recipeFiles,
    ...(compiler ? compiledMirrorFiles(compiler.compileRecipeFiles(recipeFiles).files) : {}),
    [PROBE_PATH]: { code: probeSource, hidden: true },
    [ENTRY_PATH]: {
      code: entrySourceFor(strictMode, compiler ? `.${COMPILED_DIR}/App` : './App'),
      hidden: true,
    },
  };
  sandboxFilesCache.set(cacheKey, files);
  return files;
}

// Código actual (con las ediciones del lector) de los ficheros de la receta.
function recipeSources(
  slug: string,
  files: Record<string, { code: string }>,
): Record<string, string> {
  const sources: Record<string, string> = {};
  for (const [path, original] of Object.entries(getReactFiles(slug) ?? {})) {
    sources[path] = files[path]?.code ?? original;
  }
  return sources;
}

type CompiledMirrorProps = {
  slug: string;
  compiler: Compiler;
};

// Recompila cada edición del lector y la escribe en el espejo oculto, que es lo
// que importa el entry. Muestra cuántos componentes ha compilado.
function CompiledMirror({ slug, compiler }: CompiledMirrorProps) {
  const { sandpack } = useSandpack();
  const { files, updateFile } = sandpack;
  // Diferido: compilar no frena la escritura en el editor.
  const deferredFiles = useDeferredValue(files);
  const { files: compiled, report } = useMemo(
    () => compiler.compileRecipeFiles(recipeSources(slug, deferredFiles)),
    [compiler, slug, deferredFiles],
  );

  // Sincroniza el bundler de Sandpack (sistema externo) con la última compilación.
  useEffect(() => {
    const changed: SandpackFiles = {};
    for (const [path, code] of Object.entries(compiled)) {
      const mirrorPath = `${COMPILED_DIR}${path}`;
      if (files[mirrorPath]?.code !== code) changed[mirrorPath] = { code, hidden: true };
    }
    if (Object.keys(changed).length > 0) updateFile(changed);
  }, [compiled, files, updateFile]);

  const { components, hooks, problems } = report;
  const notOptimized =
    components === 0
      ? 'El código se ejecuta SIN optimizar.'
      : 'Parte del código se ejecuta SIN optimizar.';

  return (
    <div>
      <p role="status">
        React Compiler: {components}{' '}
        {components === 1 ? 'componente compilado' : 'componentes compilados'}
        {hooks > 0 && ` y ${hooks} ${hooks === 1 ? 'hook' : 'hooks'}`}.
      </p>
      {problems.length > 0 ? (
        <div role="alert">
          <strong>Aviso: la compilación ha fallado. {notOptimized}</strong>
          <ul>
            {problems.map((problem, index) => (
              <li key={index}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : (
        components === 0 && (
          <p role="alert">
            <strong>
              Aviso: el React Compiler no ha compilado ningún componente. {notOptimized}
            </strong>
          </p>
        )
      )}
    </div>
  );
}

type ReactSandboxProps = {
  slug: string;
  strictMode: boolean;
  reactCompiler: boolean;
};

export default function ReactSandbox({ slug, strictMode, reactCompiler }: ReactSandboxProps) {
  const compilerLoad = reactCompiler ? use(loadReactCompiler()) : null;
  const compiler = compilerLoad?.ok ? compilerLoad.compiler : null;
  const files = sandboxFilesFor(slug, strictMode, compiler);

  if (!files) return <p>Esta receta todavía no tiene parte React.</p>;

  return (
    <SandpackProvider
      template="react-ts"
      files={files}
      customSetup={{
        entry: ENTRY_PATH,
        dependencies: { react: '19.2.8', 'react-dom': '19.2.8' },
      }}
    >
      {compilerLoad && !compilerLoad.ok && (
        <p role="alert">
          <strong>
            Aviso: no se ha podido cargar el React Compiler ({compilerLoad.error}). El código se
            ejecuta SIN optimizar.
          </strong>
        </p>
      )}
      {compiler && <CompiledMirror slug={slug} compiler={compiler} />}
      <SandpackLayout>
        <SandpackCodeEditor />
        <SandpackStack>
          <SandpackPreview style={{ flex: 7 }} />
          <SandpackConsole showHeader={false} style={{ flex: 3 }} />
        </SandpackStack>
      </SandpackLayout>
    </SandpackProvider>
  );
}
