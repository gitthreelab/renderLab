// Sonda Angular de Render Lab. Import con efecto lateral: `apps/ng-host` la
// importa en la primera línea de main.ts, antes del bootstrap. Las recetas no
// la importan (P3).
//
// Cuenta 1 refresco por instancia de componente y tick cuando su template se
// re-evalúa en el update pass, sin contar checkNoChanges (§3). Al terminar cada
// tick hace parpadear las instancias refrescadas y, si la página está en un
// iframe, envía al padre un ProbeEvent por instancia con su contador acumulado.
//
// Solo mide componentes de recetas: la raíz de cada receta, registrada por
// ng-host con `recipeRoot`, y sus descendientes (ver scope.ts).
import { initialTickState, step, tally, type TickState } from './counting';
import { isEmbedded, listenToParent, postToParent, type RefreshedInstance } from './messages';
import { componentSelector, hostElementOf, onChangeDetection, ownerOf } from './ng-internals';
import { Overlay } from './overlay';
import { RecipeRoots, isInRecipe } from './scope';

const recipeRoots = new RecipeRoots();

/**
 * Registra el componente raíz de una receta y lo devuelve tal cual, para
 * usarlo en `loadComponent`. Solo se miden sus instancias y sus descendientes.
 */
export function recipeRoot<T extends object>(type: T): T {
  recipeRoots.add(type);
  return type;
}

/** Caché: el ancestro de una instancia no cambia mientras vive. */
const inRecipeCache = new WeakMap<object, boolean>();

function measured(instance: object): boolean {
  let result = inRecipeCache.get(instance);
  if (result === undefined) {
    result = isInRecipe(instance, ownerOf, (i) => recipeRoots.isRootInstance(i));
    inRecipeCache.set(instance, result);
  }
  return result;
}

let tick: TickState<object> = initialTickState();
let counts = new Map<object, number>();

/** Identificador estable por instancia mientras viva. */
const instanceIds = new WeakMap<object, string>();
let nextInstanceId = 1;

function instanceIdOf(instance: object, component: string): string {
  let id = instanceIds.get(instance);
  if (id === undefined) {
    id = `${component}#${nextInstanceId++}`;
    instanceIds.set(instance, id);
  }
  return id;
}

const embedded = isEmbedded(window);
const overlay = new Overlay(document, (instance) => counts.delete(instance));

function onTickEnded(refreshed: readonly object[]): void {
  if (refreshed.length === 0) return;
  counts = tally(counts, refreshed);

  const report: RefreshedInstance[] = [];
  for (const instance of refreshed) {
    const component = componentSelector(instance) ?? '?';
    const count = counts.get(instance) ?? 0;
    report.push({ component, instanceId: instanceIdOf(instance, component), count });

    const host = hostElementOf(instance);
    if (host) overlay.flash(instance, host, component, count);
  }

  if (embedded) postToParent(window, report);
}

onChangeDetection((event) => {
  // Los componentes de ng-host no llegan al conteo: ni cuentan ni avisan.
  if (event.kind === 'template-update' && !measured(event.key)) return;
  const result = step(tick, event);
  tick = result.state;
  const { outcome } = result;
  switch (outcome.kind) {
    case 'tick-ended':
      onTickEnded(outcome.refreshed);
      break;
    case 'repeated':
    case 'outside-tick':
      if (event.kind === 'template-update') {
        const name = componentSelector(event.key) ?? '?';
        console.warn(
          outcome.kind === 'repeated'
            ? `[probe-ng] ${name} re-evaluado dos veces en el mismo tick; cuenta 1`
            : `[probe-ng] ${name} evaluado fuera de ApplicationRef.tick(); no cuenta`,
        );
      }
      break;
  }
});

if (embedded) {
  listenToParent(window, (command) => {
    if (command.type === 'reset') {
      counts = new Map();
      overlay.clear();
    }
  });
}
