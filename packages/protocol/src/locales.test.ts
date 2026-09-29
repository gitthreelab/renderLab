import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LocalizedTextSchema,
  contentFileName,
  type LocalizedText,
} from './locales';

describe('locales', () => {
  it('el locale por defecto es "es" y está soportado', () => {
    expect(DEFAULT_LOCALE).toBe('es');
    expect(LOCALES).toContain(DEFAULT_LOCALE);
  });

  it('contentFileName devuelve content.<locale>.mdx', () => {
    expect(contentFileName('es')).toBe('content.es.mdx');
  });
});

describe('LocalizedTextSchema', () => {
  it('acepta texto con el locale por defecto', () => {
    expect(LocalizedTextSchema.safeParse({ es: 'Hola' }).success).toBe(true);
  });

  it('rechaza texto sin "es"', () => {
    expect(LocalizedTextSchema.safeParse({}).success).toBe(false);
  });

  it('rechaza "es" vacío o solo espacios', () => {
    expect(LocalizedTextSchema.safeParse({ es: '' }).success).toBe(false);
    expect(LocalizedTextSchema.safeParse({ es: '   ' }).success).toBe(false);
  });

  it('rechaza locales no soportados', () => {
    expect(LocalizedTextSchema.safeParse({ es: 'Hola', fr: 'Salut' }).success).toBe(false);
  });

  it('rechaza lo que no es un objeto', () => {
    expect(LocalizedTextSchema.safeParse('Hola').success).toBe(false);
  });
});

describe('LocalizedText (tipo)', () => {
  it('exige el locale por defecto', () => {
    expectTypeOf<LocalizedText>().toEqualTypeOf<{ es: string }>();
  });
});
