# Spike T01b: sonda Angular

## Pregunta
¿Podemos contar los refrescos de template por componente en una app Angular
zoneless, sin tocar el código de los componentes medidos, cumpliendo la
métrica de la constitución (§3: 1 por update pass, sin contar checkNoChanges)?

## Resultado
**Go.** Con `@angular/core` **22.2.0** (todos los `@angular/*` fijados a esa
versión exacta), la sonda de `src/probe.ts` cuenta los refrescos por componente
usando el profiler interno de Angular, sin que ningún componente la importe. En
las tres variantes y en los tres modos de checkNoChanges (normal, exhaustivo e
intervalo), sus contadores cuadran con la referencia al cargar, tras 1 clic y
tras 2 clics. El pase checkNoChanges se distingue solo con los eventos del
profiler y no se cuenta.

Resultados (sonda = referencia en todos los casos; validado con Playwright):

| Variante | Momento | Padre | HijoA | HijoB | Boton |
|---|---|---|---|---|---|
| 1. Todo Eager | carga / 1 clic / 2 clics | 1 / 2 / 3 | 1 / 2 / 3 | 1 / 2 / 3 | — |
| 2. HijoB OnPush | carga / 1 clic / 2 clics | 1 / 2 / 3 | 1 / 2 / 3 | 1 / 1 / 1 | — |
| 3. Service con signal | carga / 1 clic / 2 clics | 1 / 1 / 1 | 1 / 2 / 3 | 1 / 1 / 1 | 1 / 2 / 3 |

En la variante 3 también suben `app-service-ruta` (el componente de la ruta,
que contiene a Boton y a Padre como hermanos) y `app-root`: son ancestros de
Boton y el clic los marca como sucios (ver "Variante 3" más abajo).

### Variante 3: diseño actual
- Padre, HijoA, HijoB, Boton y el componente de la ruta usan la estrategia por
  defecto de Angular 22 (OnPush).
- `count` vive en `CounterStore` con un signal y solo el template de HijoA lo
  lee.
- El botón "Sumar" está en Boton, hermano de Padre dentro de la ruta.

Qué refresca Angular en cada clic y por qué:
- **Boton:** el listener `(click)` marca como sucia su vista y todos sus
  ancestros (`markViewDirty`).
- **app-service-ruta y app-root:** son esos ancestros de Boton.
- **HijoA:** su template es consumidor del signal. Al cambiar `count`, Angular
  marca solo esa vista para refresco y a sus ancestros solo para recorrido.
- **Padre:** se recorre, pero no se re-evalúa. Es OnPush, no está sucio y no
  lee ningún signal.
- **HijoB:** ni siquiera se visita. Es OnPush y no tiene nada pendiente.

En modo exhaustivo, checkNoChanges re-evalúa los seis componentes en cada
tick. La sonda los ignora y sigue cuadrando con la columna "update" de la
referencia.

### Por qué el primer diseño de la variante 3 no funcionaba
En el primer diseño, la variante 3 daba los mismos números que la 1 (Padre,
HijoA e HijoB a 1/2/3) por dos motivos que se suman:
1. **El botón estaba dentro de Padre.** En Angular, un listener de template
   marca como sucia la vista del componente que lo declara y la de todos sus
   ancestros. Padre se refrescaba en cada clic aunque no leyera `count`.
2. **Todos los componentes eran Eager.** Un componente Eager se refresca
   siempre que se refresca su padre, así que HijoB caía detrás de Padre.

Mover el estado a un service no basta. Para que se vea el refresco localizado
por signals, los componentes tienen que ser OnPush (el default en v22) y el
evento no puede nacer en un ancestro de los componentes que se quieren dejar
quietos.

## Cómo funciona la sonda
1. `main.ts` importa `./probe` antes que nada.
2. `window.ng.ɵsetProfiler` solo se publica en dev mode al crear la plataforma
   (dentro de `bootstrapApplication`, antes del primer tick). La sonda deja
   preparado `window.ng` con un setter en `ɵsetProfiler` y se registra en el
   momento exacto en que Angular lo asigna. Es el mismo truco que el hook
   global de React DevTools.
3. Escucha estos eventos de `ɵProfilerEvent`:
   - `ChangeDetectionStart` / `ChangeDetectionEnd`: delimitan
     `ApplicationRef.tick()`.
   - `ChangeDetectionSyncStart` / `ChangeDetectionSyncEnd`: delimitan cada
     vuelta de `synchronize()`, que es donde ocurre el update pass real.
   - `TemplateUpdateStart`: una evaluación de template en modo update. El
     `instance` que recibe es el contexto de la vista.
4. Regla de conteo:
   - Si `instance` no es un componente (`reflectComponentType` devuelve
     `null`), se ignora. Así se descartan las vistas embebidas de `@if`,
     `@for` y `ng-template`.
   - Si llega dentro de un Sync, cuenta 1, con un máximo de 1 por instancia y
     tick.
   - Si llega dentro del tick pero fuera de un Sync, es checkNoChanges y se
     ignora. En `tick()` el código es `synchronize(); for (view of allViews)
     view.checkNoChanges();` y ese segundo bucle no emite eventos Sync.
   - Si llega fuera de un tick, se avisa y no cuenta. Pasa con
     `detectChanges()` manual o con el checkNoChanges exhaustivo por
     intervalo.
5. En `ChangeDetectionEnd`, si algo cambió, imprime los contadores
   acumulados y cuántas evaluaciones de checkNoChanges ignoró en ese tick.

## Cómo se valida (referencia)
- `src/reference.ts` es temporal y no usa el profiler. Cada componente llama a
  `trace('<selector>')` desde su template.
- La fase se separa con API pública: un `afterEveryRender`, que corre dentro
  de `synchronize()` y después del update pass, marca "lo siguiente es
  checkNoChanges". Una microtarea, que corre cuando el tick síncrono ha
  terminado, vuelve a marcar "update".
- La referencia imprime ambas columnas por separado. Sirve para comprobar dos
  cosas: que la sonda cuadra con "update" y que checkNoChanges existe de
  verdad, es decir, que la exclusión se está probando.
- Limitación de la referencia: no clasifica bien evaluaciones fuera de un tick
  (modo `?cnc=interval`). Para ese caso solo vale el aviso de la sonda.

## Lo que he aprendido
- **En Angular 22, OnPush es el valor por defecto.** `ChangeDetectionStrategy.Default`
  está deprecado y equivale a `Eager`. El equivalente a "React sin memo" hay que
  pedirlo explícitamente con `Eager` en cada componente, raíz incluida.
- Con la raíz OnPush (el default), checkNoChanges no baja por el árbol y no
  re-evalúa ningún template. Con la primera versión del spike la exclusión no
  se estaba probando. Por eso `App` es `Eager`, y por eso existe el modo
  `?cnc=exhaustive` (`provideCheckNoChangesConfig`), que re-evalúa todas las
  vistas, también las OnPush. En la variante 2 exhaustiva, checkNoChanges
  evalúa HijoB tras cada clic y la sonda sigue contando 1.
- `ɵsetProfiler` **ya no se exporta** desde `@angular/core`. Solo existe como
  global util `window.ng.ɵsetProfiler`, que es lo que usa Angular DevTools. Lo
  que sí se exporta es `ɵProfilerEvent` y el tipo `ɵProfiler`.
- `setProfiler` admite varios callbacks, así que la sonda convive con DevTools.
- Los nombres de clase no sirven para identificar componentes: el builder los
  renombra en dev (`App` → `_App`). La sonda identifica por **selector**
  (`reflectComponentType(type).selector`, API pública).
- Un listener de template marca como sucios a su componente y a todos sus
  ancestros. Dónde está el botón decide qué se refresca: con el botón en
  Padre, la variante 3 no demostraba nada (ver "Por qué el primer diseño de la
  variante 3 no funcionaba"). Merece una línea en el `content.mdx` de la
  receta.
- La navegación también es un tick y la sonda la cuenta (la raíz se refresca).
- Los contadores se acumulan por selector, no por instancia: al volver a una
  ruta, el componente nuevo suma sobre el anterior.

## Dependencias de APIs internas (ɵ) y de detalles de implementación
Todo esto puede romperse al cambiar de versión y hay que revalidarlo (§6):
- `window.ng.ɵsetProfiler`: global util interna y solo en dev mode. En un
  build de producción la sonda queda inerte.
- `ɵProfilerEvent` (valores 2, 12, 13, 14 y 15) y el tipo `ɵProfiler`.
- Que `publishUtil` haga `ng ??= {}; ng[name] = fn`, que es lo que permite
  capturar `ɵsetProfiler` con un setter antes del bootstrap.
- Que `ApplicationRef.tick()` emita checkNoChanges **fuera** del bracket
  `ChangeDetectionSync*`. Es la base de la exclusión.
- Que `TemplateUpdateStart` reciba como `instance` el contexto de la vista, y
  que en vistas de componente ese contexto sea la instancia del componente.

## Qué haría falta para packages/probe-ng
- Mover la lógica de `probe.ts` a `packages/probe-ng` como import con efecto
  lateral para el `main.ts` de `apps/ng-host`, que la importará antes del
  bootstrap. Las recetas no la importan.
- En lugar de `console.log`, emitir por `postMessage` el evento del protocolo
  (`{ source: 'render-lab', framework: 'angular', component, count }`), por
  tick y validado con Zod en `packages/protocol`.
- **Contadores por instancia, no por selector.** El spike acumula por
  selector: dos HijoA en la misma receta, o volver a una ruta, suman sobre el
  mismo contador. Los badges y el parpadeo son por componente pintado, así que
  la sonda debe llevar un contador por instancia (por ejemplo, en un
  `WeakMap<object, number>`) y localizar su host con
  `ng.getHostElement(instance)` (otra global util de dev). El selector queda
  solo como etiqueta legible.
- **En Angular 22, OnPush es el valor por defecto.** Esto cambia cómo se
  plantea la comparación con React:
  - El Angular idiomático de 2026 ya se parece a "React con memo en todo",
    no a "React sin memo".
  - Cada receta debe decir explícitamente qué estrategia usa en cada
    componente. Si una receta quiere mostrar el comportamiento "sin memo",
    tiene que pedir `Eager` a propósito y marcarlo como tal en el
    `content.mdx`.
  - Si no, el marcador "React N / Angular M" compara cosas distintas sin
    decirlo.
- Filtrar por componentes de la receta (prefijo de selector o carpeta), para
  no mostrar `app-root` ni el layout del host.
- Implementar el reset que pide el marcador.
- Construir `ng-host` con configuración de desarrollo: la sonda depende de
  `ngDevMode`.
- Tests: repetir en Playwright este recorrido (3 variantes × carga/1/2 clics,
  modos normal y exhaustivo) como test de regresión de la sonda al cambiar de
  versión de Angular.
- Receta con `@defer`, `@for` y `ng-template`: comprobar que las vistas
  embebidas no cuentan y que `DeferBlockState` no altera el conteo.
- `ChangeDetectorRef.detectChanges()` manual fuera de un tick hoy no cuenta
  (solo avisa). Hay que decidir si cuenta como refresco. En zoneless es raro,
  pero una receta podría usarlo.

## Cómo ejecutarlo
- `pnpm install`, `pnpm start` y abrir `http://localhost:4200`.
- Rutas: `/default`, `/onpush`, `/service`. Se cambia de variante con los
  enlaces, sin recompilar.
- Modos de checkNoChanges: `?cnc=exhaustive` y `?cnc=interval`.
- `pnpm build` compila en configuración de desarrollo, a propósito, igual que
  hará `ng-host`.
- Consola: las líneas `[probe]` son la sonda y las líneas `[ref]` son la
  referencia temporal.
