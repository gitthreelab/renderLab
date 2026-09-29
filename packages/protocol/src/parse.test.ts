import { describe, expect, it } from 'vitest';
import { parseLabCommand, parseProbeEvent, parseRecipeMeta } from './parse';

describe('parse*', () => {
  it('devuelve ok con el dato validado', () => {
    const result = parseLabCommand({ source: 'render-lab', type: 'reset', extra: 1 });
    expect(result).toEqual({ ok: true, data: { source: 'render-lab', type: 'reset' } });
  });

  it('devuelve un error legible sin lanzar', () => {
    const result = parseProbeEvent({
      source: 'render-lab',
      framework: 'react',
      component: 'Counter',
      instanceId: '1',
      count: -3,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('count');
  });

  it('no lanza con entradas arbitrarias', () => {
    for (const input of [undefined, null, 42, 'x', [], {}]) {
      expect(() => parseRecipeMeta(input)).not.toThrow();
      expect(parseRecipeMeta(input).ok).toBe(false);
    }
  });

  it('señala el campo inválido de la meta', () => {
    const result = parseRecipeMeta({
      slug: 'Mal Slug',
      order: 1,
      title: { es: 'a' },
      summary: { es: 'b' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('slug');
  });
});
