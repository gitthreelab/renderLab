import type { Framework } from '@render-lab/protocol';
import styles from './FrameworkTag.module.css';

export const FRAMEWORK_NAMES: Record<Framework, string> = {
  angular: 'Angular',
  react: 'React',
};

type FrameworkTagProps = {
  framework: Framework;
};

/** Etiqueta con el color del framework. El color viene de los tokens: --angular / --react. */
export default function FrameworkTag({ framework }: FrameworkTagProps) {
  return (
    <span className={styles.tag} data-framework={framework}>
      <span className={styles.dot} aria-hidden="true" />
      {FRAMEWORK_NAMES[framework]}
    </span>
  );
}
