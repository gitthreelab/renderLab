import { parseProbeEvent, type Framework } from '@render-lab/protocol';
import { useEffect, useState } from 'react';
import { broadcastReset } from './broadcastReset';

type Counts = Record<Framework, Record<string, number>>;

const EMPTY: Counts = { react: {}, angular: {} };

export function useProbeCounts() {
    const [counts, setCounts] = useState<Counts>(EMPTY);

    useEffect(() => {
        function onMessage(event: MessageEvent) {
            const result = parseProbeEvent(event.data);
            if (!result.ok) return;

            const { framework, instanceId, count } = result.data;
            if (framework === 'angular' && event.origin !== window.location.origin) return;

            setCounts((prev) => ({
                ...prev,
                [framework]: { ...prev[framework], [instanceId]: count },
            }));
        }

        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    function reset() {
        setCounts(EMPTY);
        broadcastReset();
    }

    return { counts, reset };
}