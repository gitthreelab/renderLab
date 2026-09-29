// ÚNICO módulo de la sonda que toca Angular. Todo lo que depende de APIs
// internas (ɵ) o de detalles de implementación vive aquí y hay que
// revalidarlo al cambiar de versión (§6 de la constitución). Fijado a
// @angular/core 22.2.0; ver spikes/ng-probe/SPIKE.md.
//
// Dependencias internas:
// - `window.ng.ɵsetProfiler` (ɵ): global util que Angular publica solo en dev
//   mode al crear la plataforma. No se exporta desde '@angular/core'.
// - Que `publishUtil` haga `ng ??= {}; ng[name] = fn`: permite capturar
//   `ɵsetProfiler` con un setter antes del bootstrap.
// - `ɵProfilerEvent` / `ɵProfiler` (ɵ): enum y tipo de los eventos.
// - Que `ApplicationRef.tick()` emita checkNoChanges FUERA del bracket
//   `ChangeDetectionSync*` (base de la exclusión, ver counting.ts).
// - Que `TemplateUpdateStart` reciba el contexto de la vista y que, en vistas
//   de componente, ese contexto sea la instancia del componente.
// - `window.ng.getHostElement` y `window.ng.getOwningComponent`: global utils
//   de dev mode (no ɵ, pero tampoco disponibles en producción). Se usa que
//   `getOwningComponent(host)` devuelve el componente en cuyo template se
//   declara el host (atravesando vistas embebidas) y `null` en la raíz.
//
// API pública usada: `reflectComponentType`, para distinguir instancias de
// componente de contextos de vistas embebidas y para leer el selector.
import {
  reflectComponentType,
  type Type,
  ɵProfilerEvent as ProfilerEvent,
  type ɵProfiler as Profiler,
} from '@angular/core';
import type { CdEvent } from './counting';

type SetProfiler = (profiler: Profiler | null) => () => void;

interface NgGlobal {
  ɵsetProfiler?: SetProfiler;
  getHostElement?: (componentOrDirective: object) => Element;
  getOwningComponent?: (elementOrDir: object) => object | null;
}

const globalRef = globalThis as { ng?: NgGlobal };

/**
 * Suscribe `listener` a los eventos de change detection de Angular, traducidos
 * a `CdEvent`. Hay que llamarlo antes de `bootstrapApplication`. Solo emite
 * `template-update` para instancias de componente (no para vistas embebidas
 * de `@if`, `@for` o `ng-template`). En producción no emite nada.
 */
export function onChangeDetection(listener: (event: CdEvent<object>) => void): void {
  const profiler: Profiler = (event, instance) => {
    switch (event) {
      case ProfilerEvent.ChangeDetectionStart:
        listener({ kind: 'tick-start' });
        break;
      case ProfilerEvent.ChangeDetectionSyncStart:
        listener({ kind: 'sync-start' });
        break;
      case ProfilerEvent.ChangeDetectionSyncEnd:
        listener({ kind: 'sync-end' });
        break;
      case ProfilerEvent.TemplateUpdateStart:
        if (instance != null && componentSelector(instance) !== null) {
          listener({ kind: 'template-update', key: instance });
        }
        break;
      case ProfilerEvent.ChangeDetectionEnd:
        listener({ kind: 'tick-end' });
        break;
    }
  };

  const existing = globalRef.ng?.ɵsetProfiler;
  if (existing) {
    existing(profiler);
    return;
  }
  // Mismo truco que el hook global de React DevTools: dejamos preparado
  // `window.ng` y nos registramos en cuanto Angular asigna `ɵsetProfiler`.
  const ng: NgGlobal = globalRef.ng ?? {};
  let stored: SetProfiler | undefined;
  Object.defineProperty(ng, 'ɵsetProfiler', {
    configurable: true,
    enumerable: true,
    get: () => stored,
    set: (fn: SetProfiler) => {
      stored = fn;
      fn(profiler);
    },
  });
  globalRef.ng = ng;
}

/**
 * Selector del componente, o `null` si `instance` no es una instancia de
 * componente. Se usa el selector y no el nombre de clase porque el builder
 * renombra las clases en dev (`App` → `_App`).
 */
export function componentSelector(instance: object): string | null {
  const type: unknown = instance.constructor;
  if (typeof type !== 'function') return null;
  return reflectComponentType(type as Type<unknown>)?.selector ?? null;
}

/** Elemento host de una instancia de componente, si Angular lo expone. */
export function hostElementOf(instance: object): Element | null {
  try {
    return globalRef.ng?.getHostElement?.(instance) ?? null;
  } catch {
    return null;
  }
}

/** Componente dueño (padre lógico) de una instancia, o `null` en la raíz. */
export function ownerOf(instance: object): object | null {
  const host = hostElementOf(instance);
  if (!host) return null;
  try {
    return globalRef.ng?.getOwningComponent?.(host) ?? null;
  } catch {
    return null;
  }
}
