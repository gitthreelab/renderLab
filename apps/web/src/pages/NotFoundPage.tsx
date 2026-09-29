import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <main>
      <h1>No encontrado</h1>
      <Link to="/">Volver al listado</Link>
    </main>
  );
}
