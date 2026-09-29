// REFERENCIA TEMPORAL para validar la sonda. No forma parte de la sonda y no
// usa ningún evento del profiler: los componentes llaman a `trace()` desde su
// template y aquí se clasifica cada llamada como update pass o checkNoChanges.
//
// Cómo se separan: en ApplicationRef.tick() el orden es
//   synchronize() [update pass + hooks afterEveryRender] → checkNoChanges → fin del tick
// Un afterEveryRender (API pública) marca "a partir de aquí es verificación" y
// una microtarea, que corre cuando el tick síncrono ha terminado, lo desmarca.
import { afterEveryRender, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';

let phase: 'update' | 'checkNoChanges' = 'update';
const updates = new Map<string, number>();
const checks = new Map<string, number>();

function format(map: Map<string, number>): string {
  return [...map].map(([name, n]) => `${name}=${n}`).join(' ') || '-';
}

export function trace(name: string): string {
  const target = phase === 'update' ? updates : checks;
  target.set(name, (target.get(name) ?? 0) + 1);
  console.log(`[ref] ${name} template (${phase})`);
  return '';
}

export function provideReferencePhases(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    afterEveryRender(() => {
      phase = 'checkNoChanges';
      queueMicrotask(() => {
        phase = 'update';
        console.log(`[ref] update: ${format(updates)} | checkNoChanges: ${format(checks)}`);
      });
    });
  });
}
