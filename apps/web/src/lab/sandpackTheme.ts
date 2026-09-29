import type { SandpackTheme } from '@codesandbox/sandpack-react';

// Tema de Sandpack a juego con styles/tokens.css, en claro y en oscuro.
//
// Los colores van en hexadecimal y no como variables CSS porque Sandpack decide
// el modo (claro u oscuro) leyendo el valor de `surface1`. Las fuentes sí pueden
// ser variables: se copian tal cual a la hoja de estilos.

const font: SandpackTheme['font'] = {
  body: 'var(--font-sans)',
  mono: 'var(--font-mono)',
  size: '13px',
  lineHeight: '20px',
};

export const lightTheme: SandpackTheme = {
  colors: {
    surface1: '#ffffff',
    surface2: '#eef0f3',
    surface3: '#e3e7ec',
    clickable: '#5c6675',
    base: '#16191d',
    disabled: '#a0a8b3',
    hover: '#16191d',
    accent: '#0e7490',
    error: '#b91c1c',
    errorSurface: '#fdecec',
    warning: '#92400e',
    warningSurface: '#fdf3e0',
  },
  syntax: {
    plain: '#16191d',
    comment: { color: '#6b7582', fontStyle: 'italic' },
    keyword: '#1d4ed8',
    definition: '#16191d',
    punctuation: '#5c6675',
    property: '#6d28d9',
    tag: '#0e7490',
    static: '#b45309',
    string: '#15803d',
  },
  font,
};

export const darkTheme: SandpackTheme = {
  colors: {
    surface1: '#151a21',
    surface2: '#1b2129',
    surface3: '#232a34',
    clickable: '#a4adba',
    base: '#e7eaef',
    disabled: '#5c6675',
    hover: '#e7eaef',
    accent: '#61dafb',
    error: '#fca5a5',
    errorSurface: '#3a1a1a',
    warning: '#fbbf24',
    warningSurface: '#2e2410',
  },
  syntax: {
    plain: '#e7eaef',
    comment: { color: '#8b95a3', fontStyle: 'italic' },
    keyword: '#9ecbff',
    definition: '#e7eaef',
    punctuation: '#a4adba',
    property: '#c4b5fd',
    tag: '#61dafb',
    static: '#fbbf24',
    string: '#86efac',
  },
  font,
};

export function sandpackThemeFor(dark: boolean): SandpackTheme {
  return dark ? darkTheme : lightTheme;
}
