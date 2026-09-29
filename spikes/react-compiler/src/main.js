// Host del prototipo, sin React (el único código React del spike es el fixture).
// Usa sandpack-client, el mismo cliente que sandpack-react usa por dentro.
import { loadSandpackClient } from '@codesandbox/sandpack-client';
import probeSource from '../../../packages/probe-react/dist/probe.js?raw';
import fixtureSource from '../fixture/App.tsx?raw';

const REACT_VERSION = '19.2.8';
const PROBE_PATH = '/render-lab-probe.js';
const ENTRY_PATH = '/render-lab-entry.js';
const COMPILED_DIR = '/__compiled__';

const params = new URLSearchParams(location.search);
const state = {
  route: params.get('route') ?? 'precompile',
  compiler: params.get('compiler') === '1',
  strict: params.get('strict') === '1',
  // Ficheros visibles de la receta: lo que edita el lector.
  recipeFiles: { '/App.tsx': fixtureSource },
};

const $ = (id) => document.getElementById(id);
const editor = $('editor');
const statusEl = $('status');
const logEl = $('log');

// Métricas legibles desde Playwright.
const metrics = (window.__metrics = {
  route: state.route,
  compiler: state.compiler,
  strict: state.strict,
  t0: performance.now(),
  compileMs: 0,
  compilerLoadMs: 0,
  readyMs: null,
  compiledFunctions: 0,
  compileErrors: [],
  edits: 0,
  lastCompileMs: 0,
  sandpackErrors: [],
});

function log(line) {
  logEl.textContent += `${line}\n`;
}

// ---- Marcador (misma lógica que useProbeCounts: último count por instancia) ----
const counts = new Map();
window.__counts = () => Object.fromEntries(counts);

function renderScore() {
  $('score').innerHTML = [...counts]
    .map(([id, count]) => `<tr><td>${id}</td><td>${count}</td></tr>`)
    .join('');
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.source !== 'render-lab' || data.framework !== 'react') return;
  counts.set(data.instanceId, data.count);
  renderScore();
  if (metrics.readyMs === null && ['Padre#1', 'HijoA#1', 'HijoB#1'].every((id) => counts.has(id))) {
    metrics.readyMs = performance.now() - metrics.t0;
    statusEl.textContent = `lista en ${Math.round(metrics.readyMs)} ms`;
    log(`preview lista: ${Math.round(metrics.readyMs)} ms`);
  }
});

function resetCounts() {
  counts.clear();
  renderScore();
  $('preview').contentWindow?.postMessage({ source: 'render-lab', type: 'reset' }, '*');
}
window.__reset = resetCounts;

// ---- Vía 2: compilar en el lab ----
let compilerModule;
async function loadCompiler() {
  if (!compilerModule) {
    const t = performance.now();
    compilerModule = await import('./compile.js');
    metrics.compilerLoadMs = performance.now() - t;
    log(`compiler cargado en ${Math.round(metrics.compilerLoadMs)} ms`);
  }
  return compilerModule;
}

async function compiledMirror(recipeFiles) {
  const { compileFile } = await loadCompiler();
  const t = performance.now();
  const mirror = {};
  let compiledFunctions = 0;
  for (const [path, code] of Object.entries(recipeFiles)) {
    try {
      const result = compileFile(path, code);
      compiledFunctions += result.compiledFunctions;
      mirror[`${COMPILED_DIR}${path}`] = { code: result.code, hidden: true };
    } catch (error) {
      // Error de sintaxis mientras el lector escribe: se pasa el original para
      // que Sandpack muestre su overlay de error de siempre.
      metrics.compileErrors.push(String(error.message).split('\n')[0]);
      mirror[`${COMPILED_DIR}${path}`] = { code, hidden: true };
    }
  }
  metrics.lastCompileMs = performance.now() - t;
  metrics.compiledFunctions = compiledFunctions;
  return mirror;
}

// ---- Ficheros del sandbox por vía ----
function entrySource(appImport) {
  return `
import { connectToLab } from '.${PROBE_PATH}';
import { StrictMode, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '${appImport}';

connectToLab(${JSON.stringify(location.origin)});
const app = createElement(App);
createRoot(document.getElementById('root')).render(
  ${state.strict} ? createElement(StrictMode, null, app) : app,
);
`;
}

const COMPILER_BABELRC = JSON.stringify({
  plugins: [['babel-plugin-react-compiler', { target: '19' }]],
});

async function sandboxSetup() {
  const recipe = Object.fromEntries(
    Object.entries(state.recipeFiles).map(([path, code]) => [path, { code }]),
  );
  const probe = { [PROBE_PATH]: { code: probeSource, hidden: true } };
  const deps = { react: REACT_VERSION, 'react-dom': REACT_VERSION };

  switch (state.route) {
    case 'precompile': {
      const mirror = state.compiler ? await compiledMirror(state.recipeFiles) : {};
      const appImport = state.compiler ? `.${COMPILED_DIR}/App` : './App';
      return {
        template: 'create-react-app',
        entry: ENTRY_PATH,
        dependencies: deps,
        files: { ...recipe, ...mirror, ...probe, [ENTRY_PATH]: { code: entrySource(appImport) } },
      };
    }
    case 'bundler-cra':
    case 'bundler-parcel': {
      const babel = state.compiler ? { '/.babelrc': { code: COMPILER_BABELRC } } : {};
      const html =
        state.route === 'bundler-parcel'
          ? { '/index.html': { code: `<div id="root"></div><script src="${ENTRY_PATH}"></script>` } }
          : {};
      return {
        template: state.route === 'bundler-cra' ? 'create-react-app' : 'parcel',
        entry: ENTRY_PATH,
        dependencies: state.compiler ? { ...deps, 'babel-plugin-react-compiler': '1.0.0' } : deps,
        files: { ...recipe, ...babel, ...html, ...probe, [ENTRY_PATH]: { code: entrySource('./App') } },
      };
    }
    case 'nodebox': {
      const plugins = state.compiler ? `[['babel-plugin-react-compiler', { target: '19' }]]` : '[]';
      const pkg = {
        scripts: { dev: 'vite' },
        dependencies: deps,
        devDependencies: {
          vite: '4.2.0',
          '@vitejs/plugin-react': '4.3.4',
          'esbuild-wasm': '0.17.12',
          ...(state.compiler ? { 'babel-plugin-react-compiler': '1.0.0' } : {}),
        },
      };
      return {
        template: 'node',
        files: {
          ...recipe,
          ...probe,
          [ENTRY_PATH]: { code: entrySource('./App') },
          '/package.json': { code: JSON.stringify(pkg, null, 2) },
          '/vite.config.js': {
            code: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react({ babel: { plugins: ${plugins} } })] });
`,
          },
          '/index.html': {
            code: `<!doctype html><html><body><div id="root"></div><script type="module" src="${ENTRY_PATH}"></script></body></html>`,
          },
        },
      };
    }
    default:
      throw new Error(`vía desconocida: ${state.route}`);
  }
}

// ---- Cliente ----
let client;

async function start() {
  const setup = await sandboxSetup();
  metrics.compileMs = metrics.lastCompileMs;
  client = await loadSandpackClient($('preview'), setup, {
    showOpenInCodeSandbox: false,
    showErrorScreen: true,
    showLoadingScreen: true,
  });
  client.listen((message) => {
    if (message.type === 'action' && message.action === 'show-error') {
      metrics.sandpackErrors.push(`${message.title}: ${message.message}`.slice(0, 500));
      log(`ERROR sandpack: ${message.title}: ${message.message}`.slice(0, 300));
    }
    if (message.type === 'status') statusEl.dataset.sandpack = message.status;
    if (message.type === 'shell/stdout' || message.type === 'stdout') {
      const text = message.payload?.data ?? '';
      if (text.trim()) window.__stdout = (window.__stdout ?? '') + text;
    }
  });
  window.__client = client;
}

// Edición en vivo: mismo camino que el lab (nuevo contenido → updateSandbox).
let editTimer;
editor.addEventListener('input', () => {
  clearTimeout(editTimer);
  editTimer = setTimeout(async () => {
    state.recipeFiles = { ...state.recipeFiles, '/App.tsx': editor.value };
    const setup = await sandboxSetup();
    metrics.edits += 1;
    log(`edición #${metrics.edits} (compilada en ${Math.round(metrics.lastCompileMs)} ms)`);
    client.updateSandbox(setup);
  }, 300);
});

// Cambiar vía o toggles recarga con parámetros: arranque limpio y medible.
function reloadWith(changes) {
  const next = new URLSearchParams(location.search);
  for (const [key, value] of Object.entries(changes)) next.set(key, value);
  location.search = next.toString();
}

$('route').value = state.route;
$('compiler').checked = state.compiler;
$('strict').checked = state.strict;
$('route').addEventListener('change', (e) => reloadWith({ route: e.target.value }));
$('compiler').addEventListener('change', (e) => reloadWith({ compiler: e.target.checked ? '1' : '0' }));
$('strict').addEventListener('change', (e) => reloadWith({ strict: e.target.checked ? '1' : '0' }));
$('reset').addEventListener('click', resetCounts);
editor.value = state.recipeFiles['/App.tsx'];

start().catch((error) => {
  metrics.sandpackErrors.push(String(error));
  log(`ERROR: ${error}`);
});
