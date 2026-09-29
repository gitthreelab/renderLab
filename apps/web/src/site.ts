// Datos del sitio que no salen de ninguna receta.
//
// MARCADORES DE POSICIÓN: los valores que empiezan por «TODO:» están pendientes
// de que el humano los rellene antes del despliegue. Mientras tanto, la interfaz
// los muestra señalados como pendientes (ver SiteFooter) en vez de enlazarlos.

export const SITE = {
  name: 'Render Lab',
  description:
    'Angular y React resolviendo la misma receta, lado a lado, con sondas que muestran qué componentes vuelven a ejecutar su vista. No es un benchmark.',
  author: {
    name: 'TODO: nombre del autor',
    url: 'TODO: https://…',
  },
  repository: {
    label: 'TODO: usuario/render-lab',
    url: 'TODO: https://github.com/usuario/render-lab',
  },
  versions: {
    angular: '22.2',
    react: '19.2',
  },
} as const;

const PLACEHOLDER_PREFIX = 'TODO:';

/** `true` si el valor todavía es un marcador de posición sin rellenar. */
export function isPlaceholder(value: string): boolean {
  return value.startsWith(PLACEHOLDER_PREFIX);
}

/** Texto del marcador sin el prefijo, para mostrarlo como pendiente. */
export function placeholderText(value: string): string {
  return value.slice(PLACEHOLDER_PREFIX.length).trim();
}
