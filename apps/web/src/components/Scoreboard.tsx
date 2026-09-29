import { useProbeCounts } from '../lab/useProbeCounts';
import buttons from '../ui/buttons.module.css';
import styles from './Scoreboard.module.css';

function sum(values: Record<string, number>): number {
  return Object.values(values).reduce((total, value) => total + value, 0);
}

/**
 * Marcador común: renders de React y refrescos de Angular para la misma
 * interacción (§3), con reset. Angular a la izquierda y React a la derecha,
 * como los paneles que tiene debajo.
 */
export default function Scoreboard() {
  const { counts, reset } = useProbeCounts();

  return (
    <section className={styles.board} aria-label="Marcador">
      <p className={styles.side} data-framework="angular">
        <span className={styles.name}>Angular</span>{' '}
        <span className={styles.value}>{sum(counts.angular)}</span>{' '}
        <span className={styles.unit}>refrescos</span>
      </p>
      <div className={styles.center}>
        <button type="button" className={`${buttons.button} ${buttons.small}`} onClick={reset}>
          Reset
        </button>
        <span className={styles.note}>Los dos lados en modo desarrollo</span>
      </div>
      <p className={styles.side} data-framework="react">
        <span className={styles.name}>React</span>{' '}
        <span className={styles.value}>{sum(counts.react)}</span>{' '}
        <span className={styles.unit}>renders</span>
      </p>
    </section>
  );
}
