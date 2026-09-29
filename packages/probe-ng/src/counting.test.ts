import { describe, expect, it } from 'vitest';
import { countEvents, initialTickState, step, tally, type CdEvent } from './counting';

type E = CdEvent<string>;

const tickStart: E = { kind: 'tick-start' };
const tickEnd: E = { kind: 'tick-end' };
const syncStart: E = { kind: 'sync-start' };
const syncEnd: E = { kind: 'sync-end' };
const update = (key: string): E => ({ kind: 'template-update', key });

/** Un tick con un update pass y, opcionalmente, un pase checkNoChanges. */
function tick(updated: string[], checkNoChanges: string[] = []): E[] {
  return [
    tickStart,
    syncStart,
    ...updated.map(update),
    syncEnd,
    ...checkNoChanges.map(update),
    tickEnd,
  ];
}

function run(events: E[]) {
  let state = initialTickState<string>();
  return events.map((event) => {
    const result = step(state, event);
    state = result.state;
    return result.outcome;
  });
}

describe('step', () => {
  it('cuenta una evaluación dentro de un update pass', () => {
    const outcomes = run([tickStart, syncStart, update('a'), syncEnd, tickEnd]);
    expect(outcomes[2]).toEqual({ kind: 'counted' });
    expect(outcomes[4]).toEqual({ kind: 'tick-ended', refreshed: ['a'] });
  });

  it('no cuenta checkNoChanges: evaluación dentro del tick pero fuera de un Sync', () => {
    const outcomes = run(tick(['a'], ['a', 'b']));
    expect(outcomes.filter((o) => o.kind === 'check-no-changes')).toHaveLength(2);
    expect(outcomes.at(-1)).toEqual({ kind: 'tick-ended', refreshed: ['a'] });
  });

  it('cuenta 1 como máximo por instancia y tick, aunque haya varias vueltas de synchronize()', () => {
    const outcomes = run([
      tickStart,
      syncStart,
      update('a'),
      syncEnd,
      syncStart,
      update('a'),
      update('b'),
      syncEnd,
      tickEnd,
    ]);
    expect(outcomes[5]).toEqual({ kind: 'repeated' });
    expect(outcomes.at(-1)).toEqual({ kind: 'tick-ended', refreshed: ['a', 'b'] });
  });

  it('no cuenta evaluaciones fuera de un tick (detectChanges manual)', () => {
    const outcomes = run([update('a'), syncStart, update('b'), syncEnd]);
    expect(outcomes[0]).toEqual({ kind: 'outside-tick' });
    // Un Sync suelto fuera de tick sí es un update pass, pero nadie lo cierra
    // con tick-end, así que no llega a acumularse.
    expect(countEvents([update('a'), syncStart, update('b'), syncEnd])).toEqual(new Map());
  });

  it('tick-start reinicia el estado aunque el tick anterior no cerrase', () => {
    const outcomes = run([tickStart, syncStart, update('a'), tickStart, syncStart, update('a')]);
    expect(outcomes[5]).toEqual({ kind: 'counted' });
  });

  it('un tick sin refrescos termina con lista vacía', () => {
    expect(run(tick([], ['a'])).at(-1)).toEqual({ kind: 'tick-ended', refreshed: [] });
  });
});

describe('countEvents', () => {
  it('acumula por clave a lo largo de varios ticks e ignora checkNoChanges', () => {
    // Variante 3 del spike: carga, 1 clic y 2 clics, con checkNoChanges exhaustivo.
    const all = ['root', 'ruta', 'boton', 'padre', 'hijo-a', 'hijo-b'];
    const click = ['root', 'ruta', 'boton', 'hijo-a'];
    const counts = countEvents([...tick(all, all), ...tick(click, all), ...tick(click, all)]);
    expect(Object.fromEntries(counts)).toEqual({
      root: 3,
      ruta: 3,
      boton: 3,
      padre: 1,
      'hijo-a': 3,
      'hijo-b': 1,
    });
  });
});

describe('tally', () => {
  it('suma 1 por instancia refrescada sin mutar el mapa original', () => {
    const before = new Map([['a', 2]]);
    const after = tally(before, ['a', 'b']);
    expect(after).toEqual(
      new Map([
        ['a', 3],
        ['b', 1],
      ]),
    );
    expect(before).toEqual(new Map([['a', 2]]));
  });
});
