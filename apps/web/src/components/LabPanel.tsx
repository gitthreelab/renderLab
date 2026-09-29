import type { Framework } from '@render-lab/protocol';
import { useId, type ReactNode } from 'react';
import FrameworkTag from '../ui/FrameworkTag';
import styles from './LabPanel.module.css';

type LabPanelProps = {
  framework: Framework;
  /** Detalle en monoespaciada junto a la etiqueta (p. ej. «Sandpack · editable»). */
  hint: string;
  /** Controles de la cabecera (toggles, botón de código). */
  actions?: ReactNode;
  children: ReactNode;
};

/** Marco de cada lado del laboratorio: barra de color, cabecera con etiqueta y cuerpo. */
export default function LabPanel({ framework, hint, actions, children }: LabPanelProps) {
  const headingId = useId();

  return (
    <section className={styles.panel} data-framework={framework} aria-labelledby={headingId}>
      <header className={styles.head}>
        <h2 id={headingId} className={styles.title}>
          <FrameworkTag framework={framework} />
          <span className={styles.hint}>{hint}</span>
        </h2>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
