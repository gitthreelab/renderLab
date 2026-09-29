import { DEFAULT_LOCALE } from '@render-lab/protocol';
import { Link, useParams } from 'react-router';
import { findRecipe } from '../recipes/loader';
import NotFoundPage from './NotFoundPage';

export default function RecipePage() {
    const { slug } = useParams();
    const recipe = slug ? findRecipe(slug) : undefined;

    if (!recipe) return <NotFoundPage />;

    return (
        <main>
            <Link to="/">← Volver</Link>
            <h1>{recipe.title[DEFAULT_LOCALE]}</h1>
            <p>{recipe.summary[DEFAULT_LOCALE]}</p>
        </main>
    );
}