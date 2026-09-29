// Qué instancias mide la sonda: solo las de recetas. Una instancia es de una
// receta si ella o alguno de sus ancestros lógicos (el componente en cuyo
// template se declara, subiendo hasta la raíz) es instancia de un componente
// raíz de receta. Los componentes de ng-host (app-root, Health, layouts) nunca
// cumplen la regla, sin tener que enumerarlos.
//
// Sin Angular ni DOM: el árbol se inyecta, así que se puede testear.

/** Tipos de componente registrados como raíz de receta. */
export class RecipeRoots {
  private readonly types = new WeakSet<object>();

  add(type: object): void {
    this.types.add(type);
  }

  isRootInstance(instance: object): boolean {
    return this.types.has(instance.constructor);
  }
}

/**
 * ¿Pertenece `instance` al subárbol de una raíz de receta? `parentOf` devuelve
 * el componente dueño de una instancia, o `null` en la raíz de la aplicación.
 */
export function isInRecipe(
  instance: object,
  parentOf: (instance: object) => object | null,
  isRecipeRoot: (instance: object) => boolean,
): boolean {
  const seen = new Set<object>();
  for (let current: object | null = instance; current !== null; current = parentOf(current)) {
    if (seen.has(current)) return false;
    seen.add(current);
    if (isRecipeRoot(current)) return true;
  }
  return false;
}
