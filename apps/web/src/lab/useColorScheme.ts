import { useSyncExternalStore } from 'react';

// Esquema de color del sistema (prefers-color-scheme). La web se tematiza sola
// con CSS; este hook existe para lo que no lee variables CSS: el tema de Sandpack.

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** `true` si el sistema prefiere el modo oscuro; se actualiza al cambiarlo. */
export function usePrefersDark(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
