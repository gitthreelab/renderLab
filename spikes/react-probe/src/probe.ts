import { instrument, traverseRenderedFibers, isCompositeFiber, getDisplayName } from "bippy";


const counts = new Map<string, number>()

instrument({
    onCommitFiberRoot(_rendererId, root) {
        traverseRenderedFibers(root, (fiber, phase) => {
            if (!isCompositeFiber(fiber) || phase === 'unmount') return
            const name = getDisplayName(fiber.type) ?? 'Anónimo'
            counts.set(name, (counts.get(name) ?? 0) + 1)
        })
        console.table(Object.fromEntries(counts))
    },
})