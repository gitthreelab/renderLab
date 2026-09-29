import { Route, Routes } from 'react-router';
import NotFoundPage from './pages/NotFoundPage';
import RecipeListPage from './pages/RecipeListPage';
import RecipePage from './pages/RecipePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RecipeListPage />} />
      <Route path="/recetas/:slug" element={<RecipePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
