import { Link } from 'react-router';
import { SITE } from '../site';
import styles from './SiteHeader.module.css';

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            <span />
            <span />
          </span>
          {SITE.name}
        </Link>
        <p className={styles.tagline}>
          Angular {SITE.versions.angular} · React {SITE.versions.react} · modo desarrollo
        </p>
      </div>
    </header>
  );
}
