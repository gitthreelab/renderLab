import { Link } from 'react-router';
import { SITE } from '../site';
import buttons from '../ui/buttons.module.css';
import PageMeta from '../ui/PageMeta';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <main id="main" className={`container ${styles.page}`}>
      <PageMeta
        title={`Página no encontrada · ${SITE.name}`}
        description="Esta dirección no corresponde a ninguna receta de Render Lab."
      />
      <p className={styles.code}>404 · no encontrado</p>
      <h1 className={styles.title}>Esta página no existe</h1>
      <p className={styles.text}>
        La dirección no corresponde a ninguna receta. Puede que el enlace sea antiguo o que la
        receta todavía sea un borrador.
      </p>
      <p>
        <Link to="/" className={`${buttons.button} ${buttons.primary}`}>
          Volver a las recetas
        </Link>
      </p>
    </main>
  );
}
