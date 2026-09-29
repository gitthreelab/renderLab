import { DEFAULT_LOCALE } from '@render-lab/protocol';
import { loadRecipes } from './recipes/loader';

const recipes = loadRecipes();

export default function App() {
  return (
    <main>
      <h1>Render Lab</h1>
      <ul>
        {recipes.map((recipe) => (
          <li key={recipe.slug}>{recipe.title[DEFAULT_LOCALE]}</li>
        ))}
      </ul>
    </main>
  );
}
