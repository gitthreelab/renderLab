import { SITE, isPlaceholder, placeholderText } from '../site';
import styles from './SiteFooter.module.css';

type CreditProps = {
  label: string;
  url: string;
};

// Enlace del pie; mientras el valor sea un marcador de posición (site.ts) lo
// muestra señalado como pendiente en vez de enlazar a ninguna parte.
function Credit({ label, url }: CreditProps) {
  if (isPlaceholder(label) || isPlaceholder(url)) {
    return (
      <span
        className={styles.placeholder}
        title="Marcador de posición: rellenar en apps/web/src/site.ts"
      >
        ⟨ {placeholderText(label)} ⟩
      </span>
    );
  }
  return (
    <a href={url} rel="noopener">
      {label}
    </a>
  );
}

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.line}>
          <span className={styles.brand}>{SITE.name}</span> · Angular {SITE.versions.angular} y
          React {SITE.versions.react}, los dos en modo desarrollo.
        </p>
        <p className={styles.line}>
          Hecho por <Credit label={SITE.author.name} url={SITE.author.url} /> · Código en{' '}
          <Credit label={SITE.repository.label} url={SITE.repository.url} />
        </p>
      </div>
    </footer>
  );
}
