import { parseProbeEvent } from '@render-lab/protocol';
import { expect, test } from 'vitest';
import { isResetFromLab, toProbeEvent } from './messages';

const parent = {};
const LAB = 'http://localhost:5173';
const reset = { source: 'render-lab', type: 'reset' };

test('toProbeEvent produce un mensaje válido', () => {
    const event = toProbeEvent({ component: 'HijoA', instanceId: 'HijoA#1', count: 3 });
    expect(parseProbeEvent(event).ok).toBe(true);
});

test('acepta un reset del lab', () => {
    expect(isResetFromLab({ source: parent, origin: LAB, data: reset }, parent, LAB)).toBe(true);
});

test('rechaza un reset de otro origen', () => {
    const event = { source: parent, origin: 'https://otra-web.com', data: reset };
    expect(isResetFromLab(event, parent, LAB)).toBe(false);
});

test('rechaza un reset que no viene del padre', () => {
    expect(isResetFromLab({ source: {}, origin: LAB, data: reset }, parent, LAB)).toBe(false);
});

test('rechaza un mensaje mal formado', () => {
    const event = { source: parent, origin: LAB, data: { type: 'reset' } };
    expect(isResetFromLab(event, parent, LAB)).toBe(false);
});