// babel-plugin-react-compiler se publica para Node: su bundle incluye utilidades
// (debug, colores de terminal…) que leen `process` y usan `global` al cargarse.
// En el navegador no existen y la carga falla con «ReferenceError: process is not
// defined». Este shim mínimo debe evaluarse antes que el plugin: por eso es el
// primer import de reactCompiler.ts y solo viaja en su chunk diferido.

// Sin los tipos de Node: aquí solo importa que existan, no su forma completa.
const scope: Record<string, unknown> = globalThis;

scope.global ??= globalThis;
scope.process ??= {
  env: { NODE_ENV: 'development' },
  argv: [],
  platform: 'browser',
  browser: true,
  versions: {},
  cwd: () => '/',
  nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) =>
    queueMicrotask(() => callback(...args)),
  emitWarning: () => {},
  stderr: { write: () => true },
};
