import {
    getDisplayName,
    instrument,
    isCompositeFiber,
    isHostFiber,
    traverseFiber,
    traverseRenderedFibers,
} from 'bippy';
import { instanceIdOf, type InstanceCount } from './instances';
import { isResetFromLab, toProbeEvent } from './messages';
import { Overlay } from './overlay';

export type { InstanceCount } from './instances';

const counts = new Map<string, InstanceCount>();
let labOrigin: string | undefined;
const overlay = new Overlay();

export function getCounts(): InstanceCount[] {
    return [...counts.values()];
}

export function resetCounts(): void {
    counts.clear();
    overlay.clear();
}

export function connectToLab(parentOrigin: string): void {
    if (window.parent === window) return;
    labOrigin = parentOrigin;

    window.addEventListener('message', (event) => {
        if (isResetFromLab(event, window.parent, parentOrigin)) resetCounts();
    });
}

instrument({
    onCommitFiberRoot(_rendererID, root) {
        const rendered: InstanceCount[] = [];

        traverseRenderedFibers(root, (fiber, phase) => {
            if (!isCompositeFiber(fiber)) return;

            const component = getDisplayName(fiber.type) ?? 'Anónimo';
            const instanceId = instanceIdOf(fiber, component);

            if (phase === 'unmount') {
                overlay.remove(instanceId);
                return;
            }

            const count = (counts.get(instanceId)?.count ?? 0) + 1;
            const entry = { component, instanceId, count };
            counts.set(instanceId, entry);
            rendered.push(entry);

            const element: unknown = traverseFiber(fiber, isHostFiber)?.stateNode;
            if (element instanceof Element) overlay.flash(instanceId, element, count);
        });

        if (labOrigin) {
            for (const entry of rendered) {
                window.parent.postMessage(toProbeEvent(entry), labOrigin);
            }
        }
    },
});