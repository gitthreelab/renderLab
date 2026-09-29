// Sonda T01b: cuenta refrescos de template por componente (métrica §3 de la
// constitución) sin tocar el código de los componentes medidos.
//
// APIs internas (ɵ) de las que depende, fijadas a @angular/core 22.2.0:
// - `window.ng.ɵsetProfiler`: solo se publica como global util en dev mode
//   (no se exporta desde '@angular/core'). Es lo mismo que usa Angular DevTools.
// - `ɵProfilerEvent` / `ɵProfiler`: enum y tipo de los eventos del profiler.
// - El orden de eventos de `ApplicationRef.tick()`:
//     ChangeDetectionStart
//       (ChangeDetectionSyncStart … TemplateUpdate* … ChangeDetectionSyncEnd)+
//       checkNoChanges de cada vista  ← TemplateUpdate* FUERA de un Sync
//     ChangeDetectionEnd
import {
  reflectComponentType,
  type Type,
  ɵProfilerEvent as ProfilerEvent,
  type ɵProfiler as Profiler,
} from '@angular/core';

type SetProfiler = (profiler: Profiler | null) => () => void;

interface NgGlobal {
  ɵsetProfiler?: SetProfiler;
}

const counts = new Map<string, number>();
/** Instancias ya contadas en el tick actual: 1 refresco por tick como máximo. */
const countedThisTick = new Set<object>();

let inTick = false;
let syncDepth = 0;
let changedThisTick = false;
let ignoredCheckNoChanges = 0;

function componentName(instance: object | null | undefined): string | null {
  if (instance == null) return null;
  const type = instance.constructor as Type<unknown>;
  // Descarta vistas embebidas (@if, @for, ng-template), cuyo contexto no es
  // una instancia de componente.
  if (typeof type !== 'function') return null;
  // Se identifica por selector: en dev el builder renombra las clases (`_App`).
  return reflectComponentType(type)?.selector ?? null;
}

const onEvent: Profiler = (event, instance) => {
  switch (event) {
    case ProfilerEvent.ChangeDetectionStart:
      inTick = true;
      countedThisTick.clear();
      changedThisTick = false;
      ignoredCheckNoChanges = 0;
      break;

    case ProfilerEvent.ChangeDetectionSyncStart:
      syncDepth++;
      break;

    case ProfilerEvent.ChangeDetectionSyncEnd:
      syncDepth--;
      break;

    case ProfilerEvent.TemplateUpdateStart: {
      const name = componentName(instance);
      if (name === null || instance == null) return;
      if (syncDepth > 0) {
        if (countedThisTick.has(instance)) {
          console.warn(`[probe] ${name} re-evaluado dos veces en el mismo tick; cuenta 1`);
          return;
        }
        countedThisTick.add(instance);
        counts.set(name, (counts.get(name) ?? 0) + 1);
        changedThisTick = true;
      } else if (inTick) {
        // Dentro del tick pero fuera de synchronize(): pase checkNoChanges.
        ignoredCheckNoChanges++;
      } else {
        // detectChanges() manual o checkNoChanges exhaustivo por intervalo.
        console.warn(`[probe] ${name} evaluado fuera de ApplicationRef.tick(); no cuenta`);
      }
      break;
    }

    case ProfilerEvent.ChangeDetectionEnd:
      inTick = false;
      syncDepth = 0;
      if (changedThisTick) {
        const summary = [...counts].map(([name, n]) => `${name}=${n}`).join(' ');
        console.log(
          `[probe] ${summary} (checkNoChanges ignorados en este tick: ${ignoredCheckNoChanges})`,
        );
      }
      break;
  }
};

function install(setProfiler: SetProfiler): void {
  setProfiler(onEvent);
}

// Angular publica `window.ng` al crear la plataforma, dentro de
// bootstrapApplication y antes del primer tick. Hacemos lo mismo que el hook de
// React DevTools: dejamos preparado el objeto y capturamos `ɵsetProfiler` en el
// momento en que Angular lo asigna (publishUtil hace `ng ??= {}; ng[name] = fn`).
const globalRef = globalThis as { ng?: NgGlobal };
const existing = globalRef.ng?.ɵsetProfiler;
if (existing) {
  install(existing);
} else {
  const ng: NgGlobal = globalRef.ng ?? {};
  let stored: SetProfiler | undefined;
  Object.defineProperty(ng, 'ɵsetProfiler', {
    configurable: true,
    enumerable: true,
    get: () => stored,
    set: (fn: SetProfiler) => {
      stored = fn;
      install(fn);
    },
  });
  globalRef.ng = ng;
}

export {};
