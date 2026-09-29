import { useProbeCounts } from '../lab/useProbeCounts';

function sum(values: Record<string, number>): number {
    return Object.values(values).reduce((total, value) => total + value, 0);
}

export default function Scoreboard() {
    const { counts, reset } = useProbeCounts();

    return (
        <section>
            <strong>React {sum(counts.react)} renders</strong>
            {' · '}
            <strong>Angular {sum(counts.angular)} refrescos</strong>{' '}
            <button onClick={reset}>Reset</button>
        </section>
    );
}