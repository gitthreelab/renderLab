import { MESSAGE_SOURCE, type LabCommand } from '@render-lab/protocol';

export function broadcastReset(): void {
    const command: LabCommand = { source: MESSAGE_SOURCE, type: 'reset' };

    for (const frame of document.querySelectorAll('iframe')) {
        frame.contentWindow?.postMessage(command, '*');
    }
}