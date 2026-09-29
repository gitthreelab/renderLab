import { describe, expect, it } from 'vitest';
import { RecipeRoots, isInRecipe } from './scope';

// Árbol de ng-host con una receta montada en el router-outlet:
// App (host) → Receta (raíz) → Padre → Hijo
class App {}
class Health {}
class Receta {}
class Padre {}
class Hijo {}

const app = new App();
const receta = new Receta();
const padre = new Padre();
const hijo = new Hijo();
const health = new Health();

const parents = new Map<object, object | null>([
  [app, null],
  [receta, app],
  [padre, receta],
  [hijo, padre],
  [health, app],
]);
const parentOf = (instance: object) => parents.get(instance) ?? null;

const roots = new RecipeRoots();
roots.add(Receta);
const inRecipe = (instance: object) =>
  isInRecipe(instance, parentOf, (i) => roots.isRootInstance(i));

describe('isInRecipe', () => {
  it('cuenta la raíz de la receta', () => {
    expect(inRecipe(receta)).toBe(true);
  });

  it('cuenta todos los descendientes de la raíz', () => {
    expect(inRecipe(padre)).toBe(true);
    expect(inRecipe(hijo)).toBe(true);
  });

  it('no cuenta los componentes de ng-host, aunque sean ancestros de la receta', () => {
    expect(inRecipe(app)).toBe(false);
    expect(inRecipe(health)).toBe(false);
  });

  it('no cuenta nada si no hay ninguna raíz registrada', () => {
    const none = new RecipeRoots();
    expect(isInRecipe(hijo, parentOf, (i) => none.isRootInstance(i))).toBe(false);
  });

  it('termina aunque el árbol tenga un ciclo', () => {
    const a = {};
    const b = {};
    const cyclic = (i: object) => (i === a ? b : a);
    expect(isInRecipe(a, cyclic, () => false)).toBe(false);
  });
});

describe('RecipeRoots', () => {
  it('reconoce instancias por su tipo, no por nombre', () => {
    const set = new RecipeRoots();
    set.add(Receta);
    expect(set.isRootInstance(new Receta())).toBe(true);
    expect(set.isRootInstance(new Padre())).toBe(false);
  });
});
