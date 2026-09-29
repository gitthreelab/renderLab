import { getDisplayName, instrument, isCompositeFiber, traverseRenderedFibers } from 'bippy';
import { instanceIdOf } from './instances';

export type InstanceCount = {
  component: string;
  instanceId: string;
  count: number;
};

const counts = new Map<string, InstanceCount>();

export function getCounts(): InstanceCount[] {
  return [...counts.values()];
}

export function resetCounts(): void {
  counts.clear();
}

instrument({
  onCommitFiberRoot(_rendererID, root) {
    traverseRenderedFibers(root, (fiber, phase) => {
      if (!isCompositeFiber(fiber) || phase === 'unmount') return;

      const component = getDisplayName(fiber.type) ?? 'Anónimo';
      const instanceId = instanceIdOf(fiber, component);
      const count = (counts.get(instanceId)?.count ?? 0) + 1;
      counts.set(instanceId, { component, instanceId, count });
    });
  },
});
