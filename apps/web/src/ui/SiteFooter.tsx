import { SITE } from '../site';
import styles from './SiteFooter.module.css';

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.line}>
          <span className={styles.brand}>{SITE.name}</span> · Angular {SITE.versions.angular} y
          React {SITE.versions.react}, los dos en modo desarrollo.
        </p>
        <p className={styles.line}>
          Hecho por{' '}
          <a href={SITE.author.url} rel="noopener">
            {SITE.author.name}
          </a>
        </p>
      </div>
    </footer>
  );
}
