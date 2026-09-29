import { describe, expect, it } from 'vitest';
import { RecipeMetaSchema, defineRecipe } from './recipe';

const valid = {
  slug: 'estado-compartido',
  order: 1,
  title: { es: 'Estado compartido' },
  summary: { es: 'Service con signals vs Context vs Zustand' },
};

describe('RecipeMetaSchema', () => {
  it('acepta una meta válida', () => {
    expect(RecipeMetaSchema.safeParse(valid).success).toBe(true);
  });

  it('acepta draft opcional', () => {
    expect(RecipeMetaSchema.safeParse({ ...valid, draft: true }).success).toBe(true);
  });

  it.each([
    'Estado-compartido',
    'estado compartido',
    'estado--compartido',
    '-estado',
    'estado-',
    '_smoke',
    '',
  ])('rechaza el slug %j', (slug) => {
    expect(RecipeMetaSchema.safeParse({ ...valid, slug }).success).toBe(false);
  });

  it.each([0, -1, 1.5])('rechaza order %j', (order) => {
    expect(RecipeMetaSchema.safeParse({ ...valid, order }).success).toBe(false);
  });

  it('rechaza title sin "es"', () => {
    expect(RecipeMetaSchema.safeParse({ ...valid, title: {} }).success).toBe(false);
  });

  it('rechaza summary sin "es"', () => {
    expect(RecipeMetaSchema.safeParse({ ...valid, summary: {} }).success).toBe(false);
  });

  it('rechaza draft no booleano', () => {
    expect(RecipeMetaSchema.safeParse({ ...valid, draft: 'yes' }).success).toBe(false);
  });

  it('rechaza campos desconocidos', () => {
    expect(RecipeMetaSchema.safeParse({ ...valid, tags: ['x'] }).success).toBe(false);
  });

  it('rechaza campos obligatorios ausentes', () => {
    for (const field of ['slug', 'order', 'title', 'summary']) {
      const meta: Record<string, unknown> = { ...valid };
      delete meta[field];
      expect(RecipeMetaSchema.safeParse(meta).success).toBe(false);
    }
  });
});

describe('defineRecipe', () => {
  it('devuelve la misma meta', () => {
    expect(defineRecipe(valid)).toBe(valid);
  });
});
