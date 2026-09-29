// global: alias de Node que también esperan esas utilidades.
globalThis.global ??= globalThis;
// babel-plugin-react-compiler empaqueta utilidades de Node (debug, chalk…) que
// leen `process` al cargarse. En el navegador basta con un process mínimo.
globalThis.process ??= {
  env: { NODE_ENV: 'development' },
  argv: [],
  platform: 'browser',
  browser: true,
  versions: {},
  cwd: () => '/',
  nextTick: (fn, ...args) => queueMicrotask(() => fn(...args)),
  emitWarning: () => {},
  stderr: { write: () => true },
};
