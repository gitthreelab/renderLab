import { MESSAGE_SOURCE, parseLabCommand, type ProbeEvent } from '@render-lab/protocol';
import type { InstanceCount } from './instances';

export function toProbeEvent({ component, instanceId, count }: InstanceCount): ProbeEvent {
    return { source: MESSAGE_SOURCE, framework: 'react', component, instanceId, count };
}

type IncomingMessage = {
    source: unknown;
    origin: string;
    data: unknown;
};

export function isResetFromLab(event: IncomingMessage, parent: unknown, labOrigin: string): boolean {
    if (event.source !== parent || event.origin !== labOrigin) return false;
    const result = parseLabCommand(event.data);
    return result.ok && result.data.type === 'reset';
}