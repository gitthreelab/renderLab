/// <reference types="vite/client" />

// Ficheros .mdx (p. ej. recipes/*/content.<locale>.mdx) compilados por
// @mdx-js/rollup a un componente React. No se usa @types/mdx: tipa con el JSX
// global, que @types/react 19 ya no declara, y el retorno quedaría en any.
declare module '*.mdx' {
  import type { ComponentType, JSX, PropsWithChildren } from 'react';

  export type MDXComponents = {
    [Tag in keyof JSX.IntrinsicElements]?:
      ComponentType<JSX.IntrinsicElements[Tag]> | keyof JSX.IntrinsicElements;
  } & {
    wrapper?: ComponentType<PropsWithChildren>;
  };

  export interface MDXProps {
    components?: MDXComponents;
  }

  export default function MDXContent(props: MDXProps): JSX.Element;
}
