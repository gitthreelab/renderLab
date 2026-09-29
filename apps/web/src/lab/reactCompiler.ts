// Compila con el React Compiler el código de una receta, en el navegador del lab.
// Este módulo pesa unos 5 MB (@babel/standalone + el plugin): solo se carga con
// import() al activar el toggle, nunca con un import estático.
import './processShim';
import * as Babel from '@babel/standalone';
import reactCompiler, { type LoggerEvent, type PluginOptions } from 'babel-plugin-react-compiler';

const CODE_FILE = /\.[jt]sx?$/;
const TS_FILE = /\.tsx?$/;
const HOOK_NAME = /^use[A-Z0-9]/;

export type CompileReport = {
  components: number;
  hooks: number;
  problems: string[];
};

export type CompileResult = {
  files: Record<string, string>;
  report: CompileReport;
};

type FileResult = { code: string } & CompileReport;

// Primera línea del error, con la ruta delante (Babel ya la pone en los suyos).
function problem(path: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const line = message.split('\n')[0] ?? message;
  return line.startsWith(`${path}: `) ? line : `${path}: ${line}`;
}

function compileFile(path: string, source: string): FileResult {
  const result: FileResult = { code: source, components: 0, hooks: 0, problems: [] };
  if (!CODE_FILE.test(path)) return result;

  const options: PluginOptions = {
    target: '19',
    // Si el compiler no puede con una función, la deja sin compilar en vez de
    // romper la receta. Ese fallo es silencioso: se recoge en `problems`.
    panicThreshold: 'none',
    // Por defecto comprueba si existe react-native-reanimated con
    // require.resolve, que no existe en el navegador («__require.resolve is not
    // a function») y deja el fichero sin compilar.
    enableReanimatedCheck: false,
    environment: {
      // En desarrollo inyecta un hash del fuente para vaciar la caché de memo en
      // cada Fast Refresh, calculado con `crypto` de Node, que aquí no existe.
      // Sandpack no deja la caché obsoleta sin él (comprobado en el spike).
      enableResetCacheOnSourceFileChanges: false,
    },
    logger: {
      logEvent(_filename: string | null, event: LoggerEvent) {
        if (event.kind === 'CompileSuccess') {
          if (event.fnName && HOOK_NAME.test(event.fnName)) result.hooks += 1;
          else result.components += 1;
        } else if (event.kind === 'CompileError') {
          result.problems.push(problem(path, event.detail.reason));
        } else if (event.kind === 'PipelineError') {
          result.problems.push(problem(path, event.data));
        }
      },
    },
  };

  try {
    const output = Babel.transform(source, {
      filename: path,
      babelrc: false,
      configFile: false,
      // Solo se quitan los tipos: el JSX lo transpila Sandpack como siempre.
      presets: TS_FILE.test(path) ? [['typescript', { isTSX: true, allExtensions: true }]] : [],
      plugins: [[reactCompiler, options]],
    });
    result.code = output.code ?? source;
  } catch (error) {
    // Normalmente, un error de sintaxis mientras el lector escribe. Se pasa el
    // original para que Sandpack muestre su overlay de error de siempre.
    return { code: source, components: 0, hooks: 0, problems: [problem(path, error)] };
  }
  return result;
}

// Último resultado por fichero: la vista vuelve a pedir la compilación de
// ficheros que no han cambiado (p. ej., tras escribir el espejo compilado).
const lastByPath = new Map<string, { source: string; result: FileResult }>();

function compileFileCached(path: string, source: string): FileResult {
  const cached = lastByPath.get(path);
  if (cached?.source === source) return cached.result;

  const result = compileFile(path, source);
  lastByPath.set(path, { source, result });
  return result;
}

export function compileRecipeFiles(sources: Record<string, string>): CompileResult {
  const files: Record<string, string> = {};
  const report: CompileReport = { components: 0, hooks: 0, problems: [] };

  for (const [path, source] of Object.entries(sources)) {
    const result = compileFileCached(path, source);
    files[path] = result.code;
    report.components += result.components;
    report.hooks += result.hooks;
    report.problems.push(...result.problems);
  }

  return { files, report };
}
