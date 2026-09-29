// Vía 2: compila en el navegador del lab. Se carga con import() dinámico para
// que el coste (peso) solo lo pague quien activa el compiler.
import './process-shim.js';
import * as Babel from '@babel/standalone';
import reactCompiler from 'babel-plugin-react-compiler';

const CODE_FILE = /\.[jt]sx?$/;

/**
 * Compila con el React Compiler un fichero de la receta.
 * Solo quita tipos: el JSX se queda para que lo transpile Sandpack como siempre.
 * Devuelve también cuántas funciones memoizó el compiler (para verificar).
 */
export function compileFile(path, code) {
  if (!CODE_FILE.test(path)) return { code, compiledFunctions: 0 };
  let compiledFunctions = 0;
  const isTs = /\.tsx?$/.test(path);
  const result = Babel.transform(code, {
    filename: path,
    babelrc: false,
    configFile: false,
    presets: isTs ? [['typescript', { isTSX: true, allExtensions: true }]] : [],
    plugins: [
      [
        reactCompiler,
        {
          target: '19',
          panicThreshold: 'none',
          // Ambas tocan APIs de Node (require.resolve, crypto) que aquí no existen.
          enableReanimatedCheck: false,
          environment: { enableResetCacheOnSourceFileChanges: false },
          logger: {
            logEvent(_filename, event) {
              if (event.kind === 'CompileSuccess') compiledFunctions += 1;
            },
          },
        },
      ],
    ],
  });
  return { code: result.code ?? code, compiledFunctions };
}
