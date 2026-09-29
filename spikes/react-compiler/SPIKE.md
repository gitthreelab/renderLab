# Spike: React Compiler en Sandpack

Zona: `spikes/react-compiler/**` se asignó al agente en la sesión que creó el
spike (2026-09-29). El único código React, `fixture/App.tsx`, es un fixture
desechable que el humano autorizó expresamente al agente a escribir. El host del
prototipo no usa React: usa `@codesandbox/sandpack-client`, el mismo cliente que
`sandpack-react` usa por dentro.

## Pregunta

¿Podemos activar y desactivar el React Compiler en el código de una receta que
corre en Sandpack, de forma que la sonda lo refleje y el lector pueda seguir
editando el código?

## Resultado

**Go**, por la vía 2: compilar la receta en el navegador del lab con
`@babel/standalone` + `babel-plugin-react-compiler` y pasarle a Sandpack el
resultado en ficheros ocultos. El lector sigue editando el original.

Probado con Playwright headless (`scripts/verify.mjs`, `scripts/lazy-check.mjs`):

| Caso (Padre/HijoA/HijoB) | Al cargar | Tras 1 clic | Tras 2 clics |
| --- | --- | --- | --- |
| Sin compiler | 1/1/1 | 2/2/2 | 3/3/3 |
| Sin compiler + StrictMode | 1/1/1 | 2/2/2 | 3/3/3 |
| Con compiler | 1/1/1 | 2/2/1 | 3/3/1 |
| Con compiler + StrictMode | 1/1/1 | 2/2/1 | 3/3/1 |

- StrictMode no cuenta doble en ningún caso (§3 de la constitución).
- Edición en vivo con el compiler activo: al cambiar el texto de HijoB en el
  editor, la preview muestra el cambio en unos 850 ms. La edición entra por
  Fast Refresh: las instancias conservan su id y todas cuentan +1 por el
  refresco, igual que sin compiler. Después, HijoB sigue plano al hacer clic
  (4/4/2 → 5/5/2 → 6/6/2). Una segunda edición, en el JSX de Padre, también se
  ve al momento, sin una caché de memo obsoleta.

## Vías evaluadas

| Vía | Veredicto | Motivo |
| --- | --- | --- |
| 1a. `.babelrc` + dependencia en el bundler (entorno CRA, el de la plantilla `react-ts` del lab) | No funciona | El bundler ignora el `.babelrc` sin avisar: HijoB da 1/2/3 con el plugin configurado. Comprobado con un `.babelrc` que apunta a un plugin inexistente: no hay error y el código se ejecuta sin transformar. |
| 1b. `.babelrc` en el entorno `parcel` | No funciona | Su Babel es antiguo y no parsea `catch {}` (optional catch binding), que tiene la sonda empaquetada: falla incluso sin compiler. Con el compiler activo, la preview no llega a estar lista (timeout de 120 s sin error visible). |
| 2. Compilar en el lab con `@babel/standalone` y pasar el resultado a Sandpack | **Funciona** | Ver la tabla anterior. Preview lista en unos 1,5 s con el compiler (unos 1,1 s sin él). Añade 5,09 MB (1,18 MB con gzip), cargados en diferido. |
| 3. Plantilla Node (Nodebox) con Vite y el plugin | Descartada sin prototipo (el selector del host tiene la opción, pero no se ha ejecutado) | Ya hay una vía que funciona. Nodebox cambiaría el modelo de ejecución de todo el lab (un servidor Vite dentro de Nodebox en vez del bundler de Sandpack) y arranca mucho más despacio (instala dependencias y levanta Vite en cada carga), así que no se elegiría aunque funcionara. |

## Cómo funciona la vía 2

1. Los ficheros visibles de la receta (`/App.tsx`…) se pasan a Sandpack tal cual:
   son los que ve y edita el lector.
2. Con el toggle activo, cada fichero de código se compila con
   `Babel.transform` (preset `typescript` para quitar tipos + plugin del
   compiler, `target: '19'`). El JSX se deja para que lo transpile Sandpack como
   siempre. El resultado va en ficheros ocultos con la misma estructura bajo
   `/__compiled__/`, así que los imports relativos entre ficheros siguen valiendo.
3. El entry oculto (el mismo que el del lab: sonda primero, luego React) importa
   `./__compiled__/App` en vez de `./App`.
4. En cada edición: nuevo contenido → recompilar (unos 60 ms la primera vez con
   el fixture) → `updateSandbox`. Si el código tiene un error de sintaxis mientras
   el lector escribe, se pasa el original a `/__compiled__/` para que Sandpack
   muestre su overlay de error de siempre.
5. El compiler generado importa `react/compiler-runtime`, que viene con React
   19.2.8: no hace falta ninguna dependencia extra dentro del sandbox.

### Ajustes necesarios para que el plugin corra en el navegador

`babel-plugin-react-compiler` 1.0.0 se publica para Node. Sin estos tres ajustes
lanza una excepción en el navegador:

1. **Shim de `process` y `global`** (`src/process-shim.js`, importado antes que el
   plugin). El bundle del plugin incluye utilidades de Node (debug, colores de
   terminal…) que leen `process.env`, `process.platform`, etc., y usan `global`
   al cargarse. Sin el shim, la carga falla con `ReferenceError: process is not
   defined` y luego `global is not defined`.
2. **`enableReanimatedCheck: false`.** Por defecto, en cada fichero el plugin
   comprueba si el proyecto usa `react-native-reanimated` con
   `require.resolve(...)`. En el navegador `require.resolve` no existe, así que
   lanza `__require.resolve is not a function` y no compila nada.
3. **`environment.enableResetCacheOnSourceFileChanges: false`.** En desarrollo,
   el plugin inyecta un hash del fuente para vaciar la caché de memo en cada Fast
   Refresh, y ese hash se calcula con `crypto` de Node, que no existe en el
   navegador. Desactivarlo no deja la caché obsoleta en Sandpack: la edición en
   el JSX de Padre se ve al instante (probado).

Trampa del spike: con `panicThreshold: 'none'` y el fallback al original, un
fallo del compiler es **silencioso** (la receta corre sin compilar). Al
principio del spike pasó eso: 1/2/3 con el toggle activo y sin errores
visibles. El prototipo cuenta las funciones compiladas con `logger`
(`CompileSuccess`), y el lab debería mostrar ese número o, al menos, avisar si
es 0 con el toggle activo.

## Coste

Build de producción (`vite build`) del prototipo:

| Pieza | Sin comprimir | gzip |
| --- | --- | --- |
| Chunk diferido del compiler (`compile-*.js`, total) | 5,09 MB | 1,18 MB |
| · de él, `@babel/standalone` (`babel.min.js`) | 3,14 MB | 0,66 MB |
| · de él, el plugin + `@babel/types` (por diferencia) | ~1,95 MB | ~0,52 MB |

Carga en diferido comprobada en el build de producción (`scripts/lazy-check.mjs`
contra `vite preview`): con el toggle apagado no se pide `compile-*.js` (3 de 3
cargas). Al activar el toggle se descarga y compila (4 funciones). La carga de
una receta con el compiler apagado no cambia.

Tiempo hasta que la preview está lista (sonda con Padre, HijoA y HijoB), en
local:

| | Sin compiler | Con compiler | De ello: cargar el compiler | Compilar |
| --- | --- | --- | --- | --- |
| Dev (`vite`) | ~1,1 s | ~1,75 s | ~570 ms | ~60 ms |
| Producción (`vite preview`) | ~1,1 s | ~1,5 s | ~360–440 ms | — |

La descarga del chunk se hizo desde localhost. Con red real hay que sumar
bajar 1,18 MB con gzip la primera vez (después queda en caché del navegador).

## Qué haría falta para integrarlo en el lab

Agente (zona 4.1):

- Añadir `@babel/standalone` y `babel-plugin-react-compiler` a
  `apps/web/package.json`, con versión exacta. El compiler no está en la lista
  de §6, pero su salida depende de la versión de React, así que conviene fijarlo
  igual.
- Si hiciera falta, ajustar `apps/web/vite.config.ts` para que el chunk del
  compiler quede aparte y no se precargue (en el spike, Vite lo separó solo con
  `import()`).
- Un test Playwright e2e en `apps/web` que reproduzca la tabla de arriba
  (compiler × StrictMode, 2 clics y una edición).

Humano (zona 4.2, `apps/web/src/**`):

- Un módulo no React (p. ej. `src/lab/reactCompiler.ts`) equivalente a
  `src/compile.js` + `src/process-shim.js`, cargado con `import()` solo al
  activar el toggle.
- El toggle "React Compiler" junto al de StrictMode, incluido en la clave de
  caché de `sandboxFilesFor`.
- `ReactSandbox.tsx`: pasar de `<Sandpack>` todo-en-uno a `SandpackProvider` +
  `SandpackCodeEditor` + `SandpackPreview`, porque hay que interceptar las
  ediciones del lector (p. ej. con `useSandpack().sandpack.files` o
  `useActiveCode`), recompilar y escribir los ficheros ocultos de
  `/__compiled__/` con `updateFile`. Con `<Sandpack>` a secas, las ediciones van
  directas al bundler sin pasar por el compiler.
- El entry oculto importa `./__compiled__/App` cuando el toggle está activo.
- Mostrar en pantalla que el compiler está activo y cuántos componentes compiló
  (o un aviso si son 0).
- Actualizar `docs/IDEA.md` con la decisión.

## Riesgos

- **Fallo silencioso.** Si el plugin no puede compilar un componente (o todo el
  fichero), la receta funciona igual pero sin optimizar, y la comparación vuelve
  a quedar sesgada sin que nadie lo note. Mitigación: contar las compilaciones y
  avisar.
- **El plugin no está pensado para el navegador.** Depende de los tres ajustes
  de arriba, que tocan opciones internas. Una versión nueva puede añadir otra
  API de Node y romperlo. Fijar la versión y cubrirlo con el e2e.
- **Peso.** 1,18 MB con gzip para quien active el toggle. Se puede reducir:
  en vez de `@babel/standalone` completo, empaquetar `@babel/core` con solo el
  preset de TypeScript y el plugin (no medido en este spike).
- **Fast Refresh y caché de memo.** Con `enableResetCacheOnSourceFileChanges`
  desactivado, las ediciones probadas (texto de HijoB, JSX de Padre) se ven
  bien. No se han probado cambios de orden de hooks ni recetas de varios
  ficheros.
- **Recetas de varios ficheros.** El diseño con `/__compiled__/` las cubre
  (espejo de la estructura), pero solo se probó con un fichero. Los imports
  de CSS u otros assets relativos deben copiarse también al espejo (el
  prototipo copia tal cual lo que no es código).
- **Pedagogía.** El lector ve su código original, no el compilado. Si se quiere
  enseñar qué hace el compiler, haría falta una vista extra de solo lectura con
  la salida (ya la tenemos en memoria).
- **Contadores tras un reset.** Con el compiler, un componente memoizado no
  vuelve a renderizar, así que tras un reset la sonda no envía nada de él y el
  marcador no lo muestra (en vez de mostrar 0). Es correcto según §3, pero el
  marcador debería mostrarlo como 0.

## Cómo reproducirlo

```sh
cd spikes/react-compiler
pnpm install
pnpm dev                                   # :5199, prototipo con selector de vía y toggles
node scripts/verify.mjs http://localhost:5199 precompile --edit
node scripts/verify.mjs http://localhost:5199 bundler-cra,bundler-parcel
pnpm build && pnpm preview                 # :5198
node scripts/lazy-check.mjs http://localhost:5198
```

`CHROMIUM=<ruta a chrome-headless-shell.exe>` permite usar un Chromium ya
instalado en vez de descargar el de Playwright.
