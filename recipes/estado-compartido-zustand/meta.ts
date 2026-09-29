import { defineRecipe } from '@render-lab/protocol';

export default defineRecipe({
  slug: 'estado-compartido-zustand',
  order: 2,
  title: { es: 'Estado compartido con Zustand' },
  summary: {
    es: 'Un service con signals en Angular frente a un store de Zustand con selectores en React: suscripciones finas en los dos lados.',
  },
});
