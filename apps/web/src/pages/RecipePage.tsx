import { DEFAULT_LOCALE } from '@render-lab/protocol';
import { lazy, Suspense, useState } from 'react';
import { Link, useParams } from 'react-router';
import AngularFrame from '../components/AngularFrame';
import Scoreboard from '../components/Scoreboard';
import { broadcastReset } from '../lab/broadcastReset';
import { recipeContents } from '../recipes/content';
import { findRecipe } from '../recipes/loader';
import NotFoundPage from './NotFoundPage';

const ReactSandbox = lazy(() => import('../components/ReactSandbox'));

export default function RecipePage() {
  const { slug } = useParams();
  const [strictMode, setStrictMode] = useState(false);
  const recipe = slug ? findRecipe(slug) : undefined;

  if (!recipe) return <NotFoundPage />;

  const Content = recipeContents[recipe.slug];
  const labKey = `${recipe.slug}-${strictMode}`;

  function toggleStrictMode() {
    setStrictMode((current) => !current);
    broadcastReset();
  }

  return (
    <main>
      <Link to="/">← Volver</Link>
      <h1>{recipe.title[DEFAULT_LOCALE]}</h1>
      <p>{recipe.summary[DEFAULT_LOCALE]}</p>

      {Content ? (
        <Suspense fallback={<p>Cargando…</p>}>
          <Content />
        </Suspense>
      ) : (
        <p>Esta receta todavía no tiene explicación.</p>
      )}

      <Scoreboard key={labKey} />
      <AngularFrame slug={recipe.slug} />

      <label>
        <input type="checkbox" checked={strictMode} onChange={toggleStrictMode} /> StrictMode
      </label>

      <Suspense fallback={<p>Cargando sandbox…</p>}>
        <ReactSandbox key={labKey} slug={recipe.slug} strictMode={strictMode} />
      </Suspense>
    </main>
  );
}