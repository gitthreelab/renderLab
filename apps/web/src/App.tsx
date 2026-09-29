import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import SiteFooter from './ui/SiteFooter';
import SiteHeader from './ui/SiteHeader';

// La página de receta va en su propio chunk: la home no carga nada del laboratorio.
const RecipePage = lazy(() => import('./pages/RecipePage'));

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/recetas/:slug"
          element={
            <Suspense fallback={<main id="main" className="container" />}>
              <RecipePage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <SiteFooter />
    </>
  );
}
