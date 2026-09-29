import { describe, expect, it } from 'vitest';
import { LabCommandSchema, ProbeEventSchema } from './messages';

const event = {
  source: 'render-lab',
  framework: 'angular',
  component: 'app-counter',
  instanceId: 'app-counter#1',
  count: 0,
};

describe('ProbeEventSchema', () => {
  it.each(['react', 'angular'])('acepta framework %j', (framework) => {
    expect(ProbeEventSchema.safeParse({ ...event, framework }).success).toBe(true);
  });

  it('rechaza count negativo', () => {
    expect(ProbeEventSchema.safeParse({ ...event, count: -1 }).success).toBe(false);
  });

  it('rechaza count no entero', () => {
    expect(ProbeEventSchema.safeParse({ ...event, count: 1.5 }).success).toBe(false);
  });

  it('rechaza source distinto de "render-lab"', () => {
    expect(ProbeEventSchema.safeParse({ ...event, source: 'react-devtools' }).success).toBe(false);
  });

  it('rechaza framework desconocido', () => {
    expect(ProbeEventSchema.safeParse({ ...event, framework: 'vue' }).success).toBe(false);
  });

  it('rechaza instanceId numérico o vacío', () => {
    expect(ProbeEventSchema.safeParse({ ...event, instanceId: 1 }).success).toBe(false);
    expect(ProbeEventSchema.safeParse({ ...event, instanceId: '' }).success).toBe(false);
  });

  it('rechaza component vacío', () => {
    expect(ProbeEventSchema.safeParse({ ...event, component: '' }).success).toBe(false);
  });

  it('rechaza mensajes que no son objetos', () => {
    expect(ProbeEventSchema.safeParse(null).success).toBe(false);
    expect(ProbeEventSchema.safeParse('render-lab').success).toBe(false);
  });
});

describe('LabCommandSchema', () => {
  it('acepta reset', () => {
    expect(LabCommandSchema.safeParse({ source: 'render-lab', type: 'reset' }).success).toBe(true);
  });

  it('rechaza source distinto de "render-lab"', () => {
    expect(LabCommandSchema.safeParse({ source: 'other', type: 'reset' }).success).toBe(false);
  });

  it('rechaza tipos desconocidos', () => {
    expect(LabCommandSchema.safeParse({ source: 'render-lab', type: 'pause' }).success).toBe(false);
  });
});
