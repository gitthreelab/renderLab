import { defineRecipe } from '@render-lab/protocol';

export default defineRecipe({
  slug: 'estado-compartido',
  order: 1,
  title: { es: 'Estado compartido con Context' },
  summary: {
    es: 'Un service con signals en Angular frente a un Context en React: quién vuelve a ejecutar su vista cuando cambia una parte del estado.',
  },
});
