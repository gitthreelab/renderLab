import { DEFAULT_LOCALE } from '@render-lab/protocol';
import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { recipeContents } from '../recipes/content';
import { findRecipe } from '../recipes/loader';
import NotFoundPage from './NotFoundPage';
import AngularFrame from '../components/AngularFrame';

const ReactSandbox = lazy(() => import('../components/ReactSandbox'));

export default function RecipePage() {
  const { slug } = useParams();
  const recipe = slug ? findRecipe(slug) : undefined;

  if (!recipe) return <NotFoundPage />;

  const Content = recipeContents[recipe.slug];

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
      <AngularFrame slug={recipe.slug} />
      <Suspense fallback={<p>Cargando sandbox...</p>}>
        <ReactSandbox slug={recipe.slug} />
      </Suspense>
    </main>
  );
}
