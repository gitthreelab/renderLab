import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
  type SandpackFiles,
  type SandpackOptions,
} from '@codesandbox/sandpack-react';
import probeSource from '@render-lab/probe-react/probe.js?raw';
import { use, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type * as ReactCompiler from '../lab/reactCompiler';
import { sandpackThemeFor } from '../lab/sandpackTheme';
import { usePrefersDark } from '../lab/useColorScheme';
import { getRecipeDependencies } from '../recipes/dependencies';
import { getReactFiles } from '../recipes/reactFiles';
import buttons from '../ui/buttons.module.css';
import '../styles/sandpack.css';
import styles from './ReactSandbox.module.css';

const PROBE_PATH = '/render-lab-probe.js';
const ENTRY_PATH = '/render-lab-entry.js';
// Espejo oculto con la salida del React Compiler. Repite la estructura de la
// receta, así que los imports relativos entre sus ficheros siguen valiendo.
const COMPILED_DIR = '/__compiled__';
// Las fija el lab (§6); el schema del package.json de la receta impide declararlas.
const LAB_DEPENDENCY_VERSIONS = { react: '19.2.8', 'react-dom': '19.2.8' };

// Arranca al cargar la página, esté o no la preview en pantalla: el modo lazy
// (por defecto) observa el SandpackLayout con un margen enorme, así que su
// IntersectionObserver dispara nada más observar. No se usa 'immediate' (ni un
// árbol sin SandpackLayout, que equivale a 'immediate') porque entonces Sandpack
// crea el cliente en el doble montaje de StrictMode, dos veces a la vez, y el
// bundler queda hablando con un cliente que no es el que guarda el provider.
const SANDPACK_OPTIONS: SandpackOptions = {
  initModeObserverOptions: { rootMargin: '100000px 0px' },
};

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
    <div className={styles.compiler}>
      <p role="status" className={styles.status}>
        React Compiler: {components}{' '}
        {components === 1 ? 'componente compilado' : 'componentes compilados'}
        {hooks > 0 && ` y ${hooks} ${hooks === 1 ? 'hook' : 'hooks'}`}.
      </p>
      {problems.length > 0 ? (
        <div role="alert" className={styles.alert}>
          <strong>Aviso: la compilación ha fallado. {notOptimized}</strong>
          <ul className={styles.problems}>
            {problems.map((problem, index) => (
              <li key={index}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : (
        components === 0 && (
          <p role="alert" className={styles.alert}>
            <strong>
              Aviso: el React Compiler no ha compilado ningún componente. {notOptimized}
            </strong>
          </p>
        )
      )}
    </div>
  );
}

type DrawerTab = 'editor' | 'console';

type CodeDrawerProps = {
  id: string;
};

// Cajón bajo la preview con el editor y la consola de Sandpack. Los dos quedan
// montados (la consola conserva sus mensajes); se alterna cuál se ve.
function CodeDrawer({ id }: CodeDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('editor');

  return (
    <div id={id} className={styles.drawer}>
      <div className={styles.drawerBar} role="group" aria-label="Cajón del sandbox">
        <button
          type="button"
          className={`${buttons.button} ${buttons.small}`}
          aria-pressed={tab === 'editor'}
          onClick={() => setTab('editor')}
        >
          Editor
        </button>
        <button
          type="button"
          className={`${buttons.button} ${buttons.small}`}
          aria-pressed={tab === 'console'}
          onClick={() => setTab('console')}
        >
          Consola
        </button>
        <span className={styles.drawerHint}>Edita el código: la vista se recompila sola.</span>
      </div>
      <div className={styles.pane} hidden={tab !== 'editor'}>
        <SandpackCodeEditor showTabs showLineNumbers className={styles.editor} />
      </div>
      <div className={styles.pane} hidden={tab !== 'console'}>
        <SandpackConsole showHeader={false} className={styles.console} />
      </div>
    </div>
  );
}

type ReactSandboxProps = {
  slug: string;
  strictMode: boolean;
  reactCompiler: boolean;
  /** Muestra el cajón con el editor y la consola. */
  showCode: boolean;
  /** id del cajón, para el aria-controls del botón que lo abre. */
  codeId: string;
};

export default function ReactSandbox({
  slug,
  strictMode,
  reactCompiler,
  showCode,
  codeId,
}: ReactSandboxProps) {
  const dark = usePrefersDark();
  const compilerLoad = reactCompiler ? use(loadReactCompiler()) : null;
  const compiler = compilerLoad?.ok ? compilerLoad.compiler : null;
  const files = sandboxFilesFor(slug, strictMode, compiler);
  // Referencia estable: Sandpack descarta las ediciones del lector (vuelve a los
  // ficheros de las props) cada vez que cambia la identidad de customSetup.
  const customSetup = useMemo(
    () => ({
      entry: ENTRY_PATH,
      dependencies: { ...getRecipeDependencies(slug), ...LAB_DEPENDENCY_VERSIONS },
    }),
    [slug],
  );

  if (!files) return <p className={styles.empty}>Esta receta todavía no tiene parte React.</p>;

  return (
    <SandpackProvider
      template="react-ts"
      files={files}
      theme={sandpackThemeFor(dark)}
      customSetup={customSetup}
      options={SANDPACK_OPTIONS}
      className={`rl-sandpack ${styles.sandpack}`}
    >
      {compilerLoad && !compilerLoad.ok && (
        <div className={styles.compiler}>
          <p role="alert" className={styles.alert}>
            <strong>
              Aviso: no se ha podido cargar el React Compiler ({compilerLoad.error}). El código se
              ejecuta SIN optimizar.
            </strong>
          </p>
        </div>
      )}
      {compiler && <CompiledMirror slug={slug} compiler={compiler} />}
      {/* SandpackLayout registra el ancla del IntersectionObserver (ver SANDPACK_OPTIONS).
          La preview va envuelta en un div: como hija directa del layout, Sandpack le
          impone flex-basis 0 y 300px de alto. */}
      <SandpackLayout className={styles.layout}>
        <div className={styles.previewWrap}>
          <SandpackPreview
            className={styles.preview}
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
          />
        </div>
        {showCode && <CodeDrawer id={codeId} />}
      </SandpackLayout>
    </SandpackProvider>
  );
}
