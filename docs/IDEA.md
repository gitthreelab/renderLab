# Render Lab — Idea del proyecto

## Visión
Web interactiva que compara Angular y React resolviendo el mismo problema
("recetas") lado a lado, con ambos frameworks ejecutándose de verdad y
mostrando en directo qué componentes vuelven a ejecutar su vista en cada
interacción.

## Para quién
Devs de Angular que miran a React (y viceversa). Sirve además como
portfolio técnico y como contenido para mentoría.

## Qué ve el usuario en una receta
- Explicación breve (MDX).
- Lado Angular: app real precompilada en iframe, solo lectura, con botón
  "Abrir en StackBlitz" para editarla.
- Lado React: Sandpack editable ejecutándose en vivo.
- Cada componente parpadea (borde ~300 ms) al volver a ejecutar su vista
  y muestra un badge con su contador.
- Marcador común: "React N renders / Angular M refrescos" en la misma
  interacción, con botón de reset.
- Toggles en React: StrictMode (off por defecto) y React Compiler.

## Métrica (no negociable)
- React: render = el componente cuenta 1 por cada commit en el que se renderizó. La doble invocación de StrictMode NO cuenta doble.
- Angular: refresco = el componente cuenta 1 por cada update pass en el que su template se re-evaluó. El pase checkNoChanges de dev mode NO cuenta.
- Ambos lados corren en modo desarrollo. Se indica en pantalla.
- No se cuentan mutaciones de DOM (queda como segunda métrica en v2).

## Arquitectura decidida
- Monorepo con pnpm workspaces:
  - apps/web: el lab (Vite + React + TS strict, React Router, MDX).
  - apps/ng-host: UNA app Angular (standalone, zoneless, signals) que
    sirve todas las recetas como rutas lazy bajo /ng/.
  - packages/protocol: schema Zod de receta y de eventos de sonda.
  - packages/probe-react: sonda inyectada en Sandpack vía entry oculto
    (react-scan / bippy; plan B: hook de DevTools propio).
  - packages/probe-ng: sonda basada en el profiler interno de Angular
    (ɵsetProfiler).
  - recipes/<slug>/: meta.ts, content.es.mdx, react/, angular/.
- Las sondas envían al padre por postMessage:
  { source: 'render-lab', framework, component, count }, validado con Zod.
- Dev: ng serve en :4300 con baseHref /ng/ y proxy desde Vite.
- Build: ng-host (config de desarrollo) → apps/web/public/ng → build de web.
- Deploy estático en Vercel.

## Principios
- TS strict, sin any ni @ts-ignore.
- Añadir una receta = crear una carpeta. Nada más.
- El código que ve el lector no lleva instrumentación manual.
- React idiomático 2026: sin CRA, sin React.FC, sin fetch en useEffect
  (salvo como antipatrón explícito).
- Visualizador simple primero; se pule cuando existan las 5 recetas.
- Versiones de React y Angular fijadas (las sondas usan internos).
- Una tarea por sesión, diff revisado, commit siempre humano.

## MVP
Una receta completa: estado compartido (service con signals vs Context
vs Zustand). Después: lista filtrada, formulario, fetch con caché,
efecto con cleanup.

## Fuera de alcance del MVP
Árbol de componentes en el panel padre, modo guion (misma secuencia en
ambos iframes), métrica de mutaciones DOM, SSR/Next, selector de idioma y traducción de la interfaz.

## Riesgos principales
1. Que la sonda React no funcione dentro del iframe de Sandpack.
2. Que ɵsetProfiler no dé granularidad por componente en la versión fijada.
3. Que el builder de Angular no compile ficheros de recipes/ fuera del
   proyecto (plan B: copiar al host antes del build).

## Orden de trabajo
T01a spike sonda React · T01b spike sonda Angular · T02 monorepo ·
T03 protocol + loaders · T04 página de receta · T05 integrar sondas ·
T06 receta 1 · T07 home, StackBlitz, deploy y README.

## Decisiones tomadas
- Idioma: español por defecto; contenido modelado por idioma desde el principio; selector de idioma fuera del MVP.
- React Compiler (T05e): el código de la receta se compila en el navegador del lab con `@babel/standalone` + `babel-plugin-react-compiler`, cargados en diferido al activar el toggle, y Sandpack ejecuta el resultado desde ficheros ocultos (`/__compiled__/`). El lector edita el original; cada edición se recompila. Junto al toggle se muestra cuántos componentes se han compilado y un aviso si son 0 o si la compilación falla (ver `spikes/react-compiler/SPIKE.md`).