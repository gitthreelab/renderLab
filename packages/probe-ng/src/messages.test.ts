import { parseProbeEvent } from '@render-lab/protocol';
import { describe, expect, it } from 'vitest';
import { acceptLabCommand, toProbeEvent } from './messages';

const parent = {};
const self = { origin: 'http://localhost:5173', parent };
const reset = { source: 'render-lab', type: 'reset' };

describe('toProbeEvent', () => {
  it('produce un ProbeEvent válido de Angular', () => {
    const event = toProbeEvent({ component: 'app-root', instanceId: 'app-root#1', count: 2 });
    expect(parseProbeEvent(event)).toEqual({ ok: true, data: event });
    expect(event.framework).toBe('angular');
  });
});

describe('acceptLabCommand', () => {
  it('acepta un reset del padre y del mismo origen', () => {
    expect(acceptLabCommand({ origin: self.origin, source: parent, data: reset }, self)).toEqual(
      reset,
    );
  });

  it('rechaza otro origen', () => {
    const message = { origin: 'https://evil.example', source: parent, data: reset };
    expect(acceptLabCommand(message, self)).toBeNull();
  });

  it('rechaza mensajes que no vienen de window.parent', () => {
    expect(acceptLabCommand({ origin: self.origin, source: {}, data: reset }, self)).toBeNull();
  });

  it('rechaza datos que no son un LabCommand', () => {
    const message = { origin: self.origin, source: parent, data: { type: 'reset' } };
    expect(acceptLabCommand(message, self)).toBeNull();
  });
});
