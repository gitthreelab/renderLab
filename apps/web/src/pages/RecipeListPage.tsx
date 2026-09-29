import { DEFAULT_LOCALE } from '@render-lab/protocol';
import { Link } from 'react-router';
import { recipes } from '../recipes/loader';

export default function RecipeListPage() {
    return (
        <main>
            <h1>Render Lab</h1>
            <ul>
                {recipes.map((recipe) => (
                    <li key={recipe.slug}>
                        <Link to={`/recetas/${recipe.slug}`}>{recipe.title[DEFAULT_LOCALE]}</Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}