import styles from './Switch.module.css';

type SwitchProps = {
  /** Texto visible; es también el nombre accesible del checkbox. */
  label: string;
  checked: boolean;
  onChange: () => void;
  /** Explicación breve, como tooltip. */
  hint?: string;
};

/**
 * Interruptor: un checkbox nativo con aspecto de switch. El checkbox real,
 * transparente, cubre la pista: recibe los clics, el foco y el teclado.
 */
export default function Switch({ label, checked, onChange, hint }: SwitchProps) {
  return (
    <label className={styles.switch} title={hint}>
      <span className={styles.control}>
        <input type="checkbox" className={styles.input} checked={checked} onChange={onChange} />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </span>
      <span className={styles.text}>{label}</span>
    </label>
  );
}
