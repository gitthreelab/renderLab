import { DEFAULT_LOCALE } from '@render-lab/protocol';
import { Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { getRecipeContent } from '../recipes/content';
import { findRecipe } from '../recipes/loader';
import NotFoundPage from './NotFoundPage';

export default function RecipePage() {
    const { slug } = useParams();
    const recipe = slug ? findRecipe(slug) : undefined;

    if (!recipe) return <NotFoundPage />;

    const Content = getRecipeContent(recipe.slug);

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
        </main>
    );
}