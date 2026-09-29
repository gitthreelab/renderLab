// Entorno de desarrollo: build inicial de la sonda y, después, en paralelo, el
// watch de la sonda, ng-host (4300) y web (5173).
//
// concurrently orquesta los procesos: con Ctrl+C mata el árbol completo de cada
// uno (tree-kill → taskkill /T /F en Windows), así que no quedan servidores vivos
// ocupando los puertos, y trata ese cierre como salida limpia (código 0). Si un
// proceso muere solo con error, para los demás y la salida es 1.
//
// pnpm se invoca por su ruta (npm_execpath, que pnpm define al ejecutar el script)
// y no por el shim pnpm.cmd, que añadiría otro fichero por lotes a la cadena.
import { spawnSync } from 'node:child_process';
import { Writable } from 'node:stream';
import concurrently from 'concurrently';

const pnpm = process.env.npm_execpath ? `"${process.env.npm_execpath}"` : 'pnpm';
const probe = '@render-lab/probe-react';

const build = spawnSync(`${pnpm} --filter ${probe} build`, { shell: true, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

// Tras Ctrl+C la salida de los procesos ya es solo ruido de parada: los shims
// .cmd de node_modules/.bin preguntan «¿Desea terminar el trabajo por lotes
// (S/N)?» y los procesos acaban con código distinto de 0. Se silencia a partir
// de ese momento; mientras los servidores funcionan se ve todo, errores incluidos.
let stopping = false;
process.once('SIGINT', () => {
  stopping = true;
  process.stdout.write('\nParando el entorno de desarrollo...\n');
});
const output = new Writable({
  write(chunk, _encoding, callback) {
    if (stopping) callback();
    else process.stdout.write(chunk, callback);
  },
});

const { result } = concurrently(
  [
    { name: 'probe', command: `${pnpm} --filter ${probe} dev`, prefixColor: 'magenta' },
    { name: 'ng', command: `${pnpm} --filter ng-host dev`, prefixColor: 'red' },
    { name: 'web', command: `${pnpm} --filter web dev`, prefixColor: 'cyan' },
  ],
  { killOthersOn: ['failure'], outputStream: output },
);

result.then(
  () => process.exit(0),
  () => process.exit(1),
);
