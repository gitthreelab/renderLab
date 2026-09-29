import { describe, expect, it } from 'vitest';
import { parseRecipePackage, parseRecipePackageFor } from './parse';
import { RecipePackageSchema, recipePackageName } from './recipePackage';

const valid = {
  name: '@render-lab/recipe-estado-compartido-zustand',
  private: true,
  dependencies: { zustand: '5.0.15' },
};

const withDependencies = (dependencies: Record<string, string>) => ({ ...valid, dependencies });

describe('RecipePackageSchema', () => {
  it('acepta un package.json válido', () => {
    expect(RecipePackageSchema.safeParse(valid).success).toBe(true);
  });

  it.each(['5.0.15', '1.0.0-beta.2', '1.0.0+build.7', '0.0.0-rc-1'])(
    'acepta la versión exacta %j',
    (version) => {
      expect(RecipePackageSchema.safeParse(withDependencies({ zustand: version })).success).toBe(
        true,
      );
    },
  );

  it.each([
    '^5.0.15',
    '~5.0.15',
    '>=5.0.0',
    '5.x',
    '5',
    '5.0',
    'latest',
    '*',
    '',
    'workspace:*',
    'npm:zustand@5.0.15',
  ])('rechaza la versión %j', (version) => {
    const result = parseRecipePackage(withDependencies({ zustand: version }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('La versión debe ser exacta');
  });

  it.each(['react', 'react-dom'])('rechaza que la receta declare %j', (name) => {
    const result = parseRecipePackage(withDependencies({ [name]: '19.2.8' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(`"${name}" no puede declararse en una receta`);
  });

  it('acepta paquetes con scope y nombres parecidos a react', () => {
    const dependencies = { '@tanstack/react-query': '5.90.2', 'react-redux': '9.2.0' };
    expect(RecipePackageSchema.safeParse(withDependencies(dependencies)).success).toBe(true);
  });

  it('rechaza nombres de paquete no válidos', () => {
    const result = parseRecipePackage(withDependencies({ 'Zustand ': '5.0.15' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('no es un nombre de paquete npm válido');
  });

  it('exige "private": true', () => {
    expect(RecipePackageSchema.safeParse({ ...valid, private: false }).success).toBe(false);
    const withoutPrivate: Record<string, unknown> = { ...valid };
    delete withoutPrivate['private'];
    expect(RecipePackageSchema.safeParse(withoutPrivate).success).toBe(false);
  });

  it('rechaza campos desconocidos', () => {
    for (const field of ['devDependencies', 'peerDependencies', 'scripts']) {
      expect(RecipePackageSchema.safeParse({ ...valid, [field]: {} }).success).toBe(false);
    }
  });
});

describe('recipePackageName', () => {
  it('deriva el nombre del slug', () => {
    expect(recipePackageName('estado-compartido')).toBe('@render-lab/recipe-estado-compartido');
  });
});

describe('parseRecipePackageFor', () => {
  it('acepta el package.json de su carpeta', () => {
    expect(parseRecipePackageFor('estado-compartido-zustand', valid)).toEqual({
      ok: true,
      data: valid,
    });
  });

  it('rechaza un "name" que no corresponde a la carpeta', () => {
    const result = parseRecipePackageFor('otra-receta', valid);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('"@render-lab/recipe-otra-receta"');
  });

  it('devuelve antes los errores del schema', () => {
    const result = parseRecipePackageFor('otra-receta', withDependencies({ react: '19.2.8' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('"react" no puede declararse');
  });
});
