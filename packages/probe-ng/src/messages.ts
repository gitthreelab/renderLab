import {
  MESSAGE_SOURCE,
  parseLabCommand,
  type LabCommand,
  type ProbeEvent,
} from '@render-lab/protocol';

/** Lo que la sonda sabe de una instancia refrescada al terminar un tick. */
export interface RefreshedInstance {
  readonly component: string;
  readonly instanceId: string;
  readonly count: number;
}

export function toProbeEvent(instance: RefreshedInstance): ProbeEvent {
  return {
    source: MESSAGE_SOURCE,
    framework: 'angular',
    component: instance.component,
    instanceId: instance.instanceId,
    count: instance.count,
  };
}

/** Las partes de un `MessageEvent` que decide si se acepta una orden. */
export interface IncomingMessage {
  readonly origin: string;
  readonly source: unknown;
  readonly data: unknown;
}

/**
 * Devuelve la orden si el mensaje viene del padre del iframe, del mismo origen,
 * y es un `LabCommand` válido. Si no, `null`.
 */
export function acceptLabCommand(
  message: IncomingMessage,
  self: { readonly origin: string; readonly parent: unknown },
): LabCommand | null {
  if (message.origin !== self.origin || message.source !== self.parent) return null;
  const result = parseLabCommand(message.data);
  return result.ok ? result.data : null;
}

export function isEmbedded(win: Window): boolean {
  return win.parent !== win;
}

/** Envía al padre un `ProbeEvent` por instancia. Solo mismo origen. */
export function postToParent(win: Window, instances: readonly RefreshedInstance[]): void {
  for (const instance of instances) {
    win.parent.postMessage(toProbeEvent(instance), win.location.origin);
  }
}

/** Escucha las órdenes del padre. */
export function listenToParent(win: Window, onCommand: (command: LabCommand) => void): void {
  win.addEventListener('message', (event) => {
    const command = acceptLabCommand(event, { origin: win.location.origin, parent: win.parent });
    if (command) onCommand(command);
  });
}
