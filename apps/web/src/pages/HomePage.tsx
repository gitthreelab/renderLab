import { DEFAULT_LOCALE, type Framework } from '@render-lab/protocol';
import { Link } from 'react-router';
import { recipes } from '../recipes/loader';
import { SITE } from '../site';
import buttons from '../ui/buttons.module.css';
import { FRAMEWORK_NAMES } from '../ui/FrameworkTag';
import PageMeta from '../ui/PageMeta';
import styles from './HomePage.module.css';

// Muestra del hero: los badges reales de la receta «Estado compartido con
// Context» tras dos clics en «Sumar» (ver recipes/estado-compartido/content.es.mdx).
type SpecimenRow = { component: string; count: number; refreshed: boolean };

const SPECIMEN: Record<Framework, SpecimenRow[]> = {
  angular: [
    { component: 'App', count: 3, refreshed: true },
    { component: 'Boton', count: 3, refreshed: true },
    { component: 'VerContador', count: 3, refreshed: true },
    { component: 'VerNombre', count: 1, refreshed: false },
    { component: 'Estatico', count: 1, refreshed: false },
  ],
  react: [
    { component: 'App', count: 1, refreshed: false },
    { component: 'EstadoProvider', count: 3, refreshed: true },
    { component: 'Boton', count: 3, refreshed: true },
    { component: 'VerContador', count: 3, refreshed: true },
    { component: 'VerNombre', count: 3, refreshed: true },
    { component: 'Estatico', count: 1, refreshed: false },
  ],
};

const SPECIMEN_TOTALS = { angular: 11, react: 14 };

// Mismo orden que el laboratorio: Angular a la izquierda, React a la derecha.
const LAB_ORDER: readonly Framework[] = ['angular', 'react'];

const STEPS = [
  {
    title: 'Pulsa',
    text: 'Interactúa con la receta en cualquiera de los dos lados. Es el mismo árbol de componentes y el mismo estado, escrito en Angular y en React.',
  },
  {
    title: 'Mira qué parpadea',
    text: 'Cada componente que vuelve a ejecutar su vista se marca con un borde durante 300 ms y lleva un badge con su contador.',
  },
  {
    title: 'Compara los contadores',
    text: 'El marcador suma los renders de React y los refrescos de Angular para la misma interacción. Resetéalo y repite con StrictMode o con el React Compiler.',
  },
];

function formatOrder(order: number): string {
  return String(order).padStart(2, '0');
}

function Specimen() {
  return (
    <figure
      className={styles.specimen}
      role="img"
      aria-label="Ejemplo del laboratorio tras dos clics en «Sumar»: Angular 11 refrescos y React 14 renders. Cada componente que volvió a ejecutar su vista lleva un badge con su contador."
    >
      <div className={styles.specimenBoard}>
        <span data-framework="angular">
          <b>Angular</b> {SPECIMEN_TOTALS.angular} refrescos
        </span>
        <span className={styles.specimenReset}>Reset</span>
        <span data-framework="react">
          <b>React</b> {SPECIMEN_TOTALS.react} renders
        </span>
      </div>
      <div className={styles.specimenPanels}>
        {LAB_ORDER.map((framework) => (
          <div key={framework} className={styles.specimenPanel} data-framework={framework}>
            <span className={styles.specimenTag}>{FRAMEWORK_NAMES[framework]}</span>
            <ul className={styles.specimenTree}>
              {SPECIMEN[framework].map((row) => (
                <li key={row.component} data-refreshed={row.refreshed || undefined}>
                  <span>{row.component}</span>
                  <b>{row.count}</b>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </figure>
  );
}

export default function HomePage() {
  const firstRecipe = recipes[0];

  return (
    <main id="main">
      <PageMeta title={SITE.name} description={SITE.description} />

      <section className={`container ${styles.hero}`} aria-labelledby="hero-title">
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>
            Laboratorio de renderizado · Angular {SITE.versions.angular} · React{' '}
            {SITE.versions.react}
          </p>
          <h1 id="hero-title" className={styles.heroTitle}>
            La misma receta, en Angular y en React, lado a lado.
          </h1>
          <p className={styles.lead}>
            Render Lab ejecuta el mismo árbol de componentes en los dos frameworks, de verdad, y
            marca en cada interacción qué componentes vuelven a ejecutar su vista.
          </p>
          <p className={styles.notLead}>
            No es un benchmark ni una competición: los contadores dicen cuántas veces se vuelve a
            ejecutar el código de vista, no cuánto tarda.
          </p>
          <p className={styles.heroActions}>
            <a href="#recetas" className={`${buttons.button} ${buttons.primary}`}>
              Ver las recetas
            </a>
            {firstRecipe && (
              <Link to={`/recetas/${firstRecipe.slug}`} className={styles.heroLink}>
                Abrir la primera receta →
              </Link>
            )}
          </p>
        </div>
        <Specimen />
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="how-title">
        <h2 id="how-title" className={styles.sectionTitle}>
          Cómo funciona
        </h2>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{formatOrder(index + 1)}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="recetas"
        className={`container ${styles.section}`}
        aria-labelledby="recipes-title"
      >
        <h2 id="recipes-title" className={styles.sectionTitle}>
          Recetas
        </h2>
        <ol className={styles.cards}>
          {recipes.map((recipe) => (
            <li key={recipe.slug}>
              <Link to={`/recetas/${recipe.slug}`} className={styles.card}>
                <span className={styles.cardOrder}>Receta {formatOrder(recipe.order)}</span>
                <span className={styles.cardTitle}>{recipe.title[DEFAULT_LOCALE]}</span>
                <span className={styles.cardSummary}>{recipe.summary[DEFAULT_LOCALE]}</span>
                <span className={styles.cardCta}>Abrir el laboratorio →</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
