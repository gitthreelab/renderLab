import { DEFAULT_LOCALE } from '@render-lab/protocol';
import { lazy, Suspense, useId, useState } from 'react';
import { Link, useParams } from 'react-router';
import AngularFrame from '../components/AngularFrame';
import AngularSource from '../components/AngularSource';
import LabPanel from '../components/LabPanel';
import Scoreboard from '../components/Scoreboard';
import { broadcastReset } from '../lab/broadcastReset';
import { recipeContents } from '../recipes/content';
import { findRecipe } from '../recipes/loader';
import { SITE } from '../site';
import buttons from '../ui/buttons.module.css';
import PageMeta from '../ui/PageMeta';
import Switch from '../ui/Switch';
import NotFoundPage from './NotFoundPage';
import styles from './RecipePage.module.css';

// Sandpack (y con él la sonda y, si se activa, el compiler) va en su propio chunk.
const ReactSandbox = lazy(() => import('../components/ReactSandbox'));

const CODE_BUTTON = `${buttons.button} ${buttons.small}`;

function formatOrder(order: number): string {
  return String(order).padStart(2, '0');
}

export default function RecipePage() {
  const { slug } = useParams();
  const [strictMode, setStrictMode] = useState(false);
  const [reactCompiler, setReactCompiler] = useState(false);
  const [reactCode, setReactCode] = useState(false);
  const [angularCode, setAngularCode] = useState(false);
  const reactCodeId = useId();
  const angularCodeId = useId();
  const recipe = slug ? findRecipe(slug) : undefined;

  if (!recipe) return <NotFoundPage />;

  const title = recipe.title[DEFAULT_LOCALE];
  const summary = recipe.summary[DEFAULT_LOCALE];
  const Content = recipeContents[recipe.slug];
  // Cambiar un toggle recrea el sandbox y el marcador: la comparación empieza de cero.
  const labKey = `${recipe.slug}-${strictMode}-${reactCompiler}`;

  function toggleStrictMode() {
    setStrictMode((current) => !current);
    broadcastReset();
  }

  function toggleReactCompiler() {
    setReactCompiler((current) => !current);
    broadcastReset();
  }

  return (
    <main id="main" className={`container ${styles.page}`}>
      <PageMeta title={`${title} · ${SITE.name}`} description={summary} />

      <header className={styles.head}>
        <Link to="/" className={styles.back}>
          ← Todas las recetas
        </Link>
        <p className={styles.eyebrow}>Receta {formatOrder(recipe.order)}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.summary}>{summary}</p>
      </header>

      <section className={styles.lab} aria-label="Laboratorio">
        <Scoreboard key={labKey} />

        <div className={styles.panels}>
          <LabPanel
            framework="angular"
            hint="ng-host · solo lectura"
            actions={
              <button
                type="button"
                className={CODE_BUTTON}
                aria-label="Código Angular"
                aria-expanded={angularCode}
                aria-controls={angularCodeId}
                onClick={() => setAngularCode((open) => !open)}
              >
                Código <span className={buttons.chevron} aria-hidden="true" />
              </button>
            }
          >
            <AngularFrame slug={recipe.slug} title={title} />
            {angularCode && <AngularSource slug={recipe.slug} id={angularCodeId} />}
          </LabPanel>

          <LabPanel
            framework="react"
            hint="Sandpack · editable"
            actions={
              <>
                <Switch
                  label="StrictMode"
                  checked={strictMode}
                  onChange={toggleStrictMode}
                  hint="Renderiza dos veces en desarrollo. La métrica cuenta commits: los números no cambian."
                />
                <Switch
                  label="React Compiler"
                  checked={reactCompiler}
                  onChange={toggleReactCompiler}
                  hint="Compila el código de la receta en tu navegador con babel-plugin-react-compiler."
                />
                <button
                  type="button"
                  className={CODE_BUTTON}
                  aria-label="Código React"
                  aria-expanded={reactCode}
                  aria-controls={reactCodeId}
                  onClick={() => setReactCode((open) => !open)}
                >
                  Código <span className={buttons.chevron} aria-hidden="true" />
                </button>
              </>
            }
          >
            <Suspense
              fallback={
                <div className={styles.placeholder} role="status">
                  {reactCompiler ? 'Cargando sandbox y React Compiler…' : 'Cargando sandbox…'}
                </div>
              }
            >
              <ReactSandbox
                key={labKey}
                slug={recipe.slug}
                strictMode={strictMode}
                reactCompiler={reactCompiler}
                showCode={reactCode}
                codeId={reactCodeId}
              />
            </Suspense>
          </LabPanel>
        </div>
      </section>

      <article className={styles.prose}>
        {Content ? (
          <Suspense fallback={<p className={styles.loading}>Cargando la explicación…</p>}>
            <Content />
          </Suspense>
        ) : (
          <p className={styles.loading}>Esta receta todavía no tiene explicación.</p>
        )}
      </article>
    </main>
  );
}
