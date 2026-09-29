import { defineConfig, type Plugin } from 'vite';

// Empaqueta la sonda en un único ESM autocontenido (bippy, protocol y zod dentro)
// para inyectarlo como fichero oculto en Sandpack, cuyo bundler no resuelve bippy.

const REACT_STUB_ID = '\0render-lab:react-stub';

// bippy (dist/index.js) importa react para su hook useFiber, que la sonda no usa.
// El tree-shaking no puede quitar ese import: al cargarse, bippy ejecuta
// Reflect.get(React, 'useSyncExternalStore'), y eso cuenta como uso del módulo.
// Dejarlo externo obligaría a Sandpack a resolver react desde el fichero oculto,
// así que solo en el build (no en Vitest) react apunta a un stub sin React.
// useFiber queda inutilizable a propósito: sus hooks lanzan un error si alguien
// llega a llamarlo.
function stubReact(): Plugin {
  return {
    name: 'render-lab:stub-react',
    apply: 'build',
    enforce: 'pre',
    resolveId(id) {
      return id === 'react' ? REACT_STUB_ID : null;
    },
    load(id) {
      if (id !== REACT_STUB_ID) return null;
      return `
        const unavailable = () => {
          throw new Error('La sonda de Render Lab no incluye React: useFiber de bippy no está disponible.');
        };
        export const useEffect = unavailable;
        export const useReducer = unavailable;
        export const useRef = unavailable;
        export const useSyncExternalStore = unavailable;
      `;
    },
  };
}

const EXTERNAL_IMPORT = /^\s*import\s*["'{*\w]|\bfrom\s*["']|\bimport\s*\(|\brequire\s*\(/m;

// Falla el build (también cada regeneración en watch) si el bundle depende de
// algún módulo externo: el fichero oculto de Sandpack debe bastarse solo.
function assertSelfContained(): Plugin {
  return {
    name: 'render-lab:assert-self-contained',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue;
        const imports = [...output.imports, ...output.dynamicImports];
        const match = EXTERNAL_IMPORT.exec(output.code);
        if (imports.length > 0 || match) {
          this.error(
            `${output.fileName} no es autocontenido: ` +
              (imports.length > 0
                ? `importa ${imports.join(', ')}`
                : `contiene «${match?.[0].trim()}»`),
          );
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [stubReact(), assertSelfContained()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'probe.js',
    },
    // Sin minificar: se depura en la consola de Sandpack.
    minify: false,
  },
});
