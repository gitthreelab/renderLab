// Lógica de conteo de refrescos (métrica §3 de la constitución), sin Angular ni
// DOM: decide qué cuenta y qué no a partir de la secuencia de eventos de change
// detection. `ng-internals.ts` traduce el profiler de Angular a `CdEvent`.
//
// Secuencia de `ApplicationRef.tick()`:
//   tick-start
//     (sync-start … template-update* … sync-end)+   ← update pass: cuenta
//     template-update*                               ← checkNoChanges: no cuenta
//   tick-end

/** Evento de change detection. `K` identifica una instancia de componente. */
export type CdEvent<K> =
  | { readonly kind: 'tick-start' }
  | { readonly kind: 'sync-start' }
  | { readonly kind: 'sync-end' }
  | { readonly kind: 'template-update'; readonly key: K }
  | { readonly kind: 'tick-end' };

export interface TickState<K> {
  readonly inTick: boolean;
  readonly syncDepth: number;
  /** Instancias refrescadas en el tick en curso, en orden de evaluación. */
  readonly refreshed: readonly K[];
}

/** Qué ha supuesto un evento para el conteo. */
export type Outcome<K> =
  | { readonly kind: 'none' }
  /** Primera evaluación de la instancia en un update pass de este tick. */
  | { readonly kind: 'counted' }
  /** Segunda evaluación en el mismo tick: cuenta 1 como máximo por tick. */
  | { readonly kind: 'repeated' }
  /** Dentro del tick pero fuera de synchronize(): pase checkNoChanges. */
  | { readonly kind: 'check-no-changes' }
  /** Fuera de ApplicationRef.tick(): detectChanges() manual o checkNoChanges por intervalo. */
  | { readonly kind: 'outside-tick' }
  /** Fin del tick, con las instancias que se han refrescado en él. */
  | { readonly kind: 'tick-ended'; readonly refreshed: readonly K[] };

export interface Step<K> {
  readonly state: TickState<K>;
  readonly outcome: Outcome<K>;
}

export function initialTickState<K>(): TickState<K> {
  return { inTick: false, syncDepth: 0, refreshed: [] };
}

export function step<K>(state: TickState<K>, event: CdEvent<K>): Step<K> {
  switch (event.kind) {
    case 'tick-start':
      return { state: { inTick: true, syncDepth: 0, refreshed: [] }, outcome: { kind: 'none' } };

    case 'sync-start':
      return { state: { ...state, syncDepth: state.syncDepth + 1 }, outcome: { kind: 'none' } };

    case 'sync-end':
      return {
        state: { ...state, syncDepth: Math.max(0, state.syncDepth - 1) },
        outcome: { kind: 'none' },
      };

    case 'template-update':
      if (state.syncDepth > 0) {
        if (state.refreshed.includes(event.key)) return { state, outcome: { kind: 'repeated' } };
        return {
          state: { ...state, refreshed: [...state.refreshed, event.key] },
          outcome: { kind: 'counted' },
        };
      }
      return { state, outcome: { kind: state.inTick ? 'check-no-changes' : 'outside-tick' } };

    case 'tick-end':
      return {
        state: initialTickState<K>(),
        outcome: { kind: 'tick-ended', refreshed: state.refreshed },
      };
  }
}

/** Suma 1 a cada instancia refrescada en un tick. */
export function tally<K>(counts: ReadonlyMap<K, number>, refreshed: readonly K[]): Map<K, number> {
  const next = new Map(counts);
  for (const key of refreshed) next.set(key, (next.get(key) ?? 0) + 1);
  return next;
}

/** Contadores acumulados tras una secuencia completa de eventos. */
export function countEvents<K>(events: readonly CdEvent<K>[]): Map<K, number> {
  let state = initialTickState<K>();
  let counts = new Map<K, number>();
  for (const event of events) {
    const result = step(state, event);
    state = result.state;
    if (result.outcome.kind === 'tick-ended') counts = tally(counts, result.outcome.refreshed);
  }
  return counts;
}
