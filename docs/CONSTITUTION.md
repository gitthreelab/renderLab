# Constitución de Render Lab

Documento normativo del proyecto. Fija reglas, no describe el diseño: la
fuente de verdad del diseño es `docs/IDEA.md`. Ante conflicto entre este
documento y cualquier otro fichero del repo, incluido `docs/IDEA.md`,
prevalece este documento.

## 1. Propósito

Render Lab es una web que compara Angular y React resolviendo la misma
receta lado a lado, con ambos frameworks ejecutándose de verdad e
instrumentados para mostrar qué componentes vuelven a ejecutar su vista.
El proyecto tiene dos objetivos con el mismo peso: el producto y el
aprendizaje de React por parte del humano. Por eso el trabajo es híbrido:
el agente hace la fontanería y el humano escribe a mano todo el código
React.

## 2. Principios técnicos

- **P1 TS strict.** Todo `tsconfig` del monorepo DEBE tener `strict: true`.
  Ningún fichero fuente DEBE contener `any` ni `@ts-ignore` ni `@ts-expect-error`.
- **P2 Una receta = una carpeta.** Añadir una receta DEBE consistir solo
  en crear `recipes/<slug>/` con `meta.ts`, `content.<locale>.mdx`, `react/` y
  `angular/`. Un diff que añade una receta NO DEBE tocar ficheros fuera de
  esa carpeta.
- **P3 Sin instrumentación manual.** El código que ve el lector
  (`recipes/*/react/**` y `recipes/*/angular/**`) NO DEBE importar las
  sondas, ni contener contadores, `postMessage` ni hooks de medición. La
  instrumentación vive únicamente en `packages/probe-*`.
- **P4 React idiomático 2026.** `apps/web/src/**` y `recipes/*/react/**`
  NO DEBEN usar CRA, `React.FC` ni `fetch` dentro de `useEffect`. La única
  excepción es un antipatrón mostrado a propósito, y DEBE estar marcado
  como tal en el `content.<locale>.mdx` de la receta.
- **P5 Visualizador simple primero.** NO DEBE haber tareas de pulido del
  visualizador mientras `recipes/` no contenga las 5 recetas listadas en
  `IDEA.md` (§MVP).
- **P6 Versiones fijadas.** Ver §6.
- **P7 Una tarea por sesión, diff revisado, commit humano.** Ver §5.
- **P8 Idioma.** El idioma por defecto es el español (es). Todo texto visible de una receta DEBE modelarse por idioma (ficheros `content.<locale>.mdx` y campos de texto de `meta.ts` indexados por locale), de forma que añadir un idioma no cambie la estructura. El selector de idioma y la traducción de la interfaz quedan fuera del MVP.

## 3. Métrica

Definición no negociable. Refina la de `docs/IDEA.md`; en caso de
diferencia, prevalece esta.

- **Render (React):** el componente cuenta 1 por cada commit en el que se
  renderizó. La doble invocación de StrictMode dentro de un mismo render
  NO cuenta doble.
- **Refresco (Angular):** el componente cuenta 1 por cada update pass en
  el que su template se re-evaluó. El pase de verificación de dev mode
  (checkNoChanges) NO cuenta.
- Ambos lados DEBEN ejecutarse en modo desarrollo, y la web DEBE indicarlo
  en pantalla.
- NO se cuentan mutaciones de DOM. Esa métrica queda para v2 y NO DEBE
  mezclarse con la actual.
- El marcador DEBE mostrar ambos contadores ("React N renders / Angular M
  refrescos") para la misma interacción y DEBE tener botón de reset.

Toda sonda, badge, parpadeo o marcador que muestre un número distinto de
estas definiciones está fuera de la constitución y DEBE corregirse.

## 4. Reparto de trabajo humano / agente

Cada ruta del repo cae en exactamente una zona.

### 4.1 Zona del agente (el agente escribe código)

- Ficheros de la raíz del repo salvo `README.md`: `package.json`,
  `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.gitignore`, `.npmrc` y la
  configuración base de ESLint, Prettier, Vitest, Playwright y TypeScript.
- `.github/**` (CI).
- `scripts/**`.
- `apps/web/**` **salvo** `apps/web/src/**`: `vite.config.ts`, `tsconfig*`,
  `index.html`, proxy, `public/**` y configuración local de lint y tests.
- `apps/ng-host/**`.
- `packages/protocol/**`.
- `packages/probe-ng/**`.
- `spikes/ng-probe/**`.

### 4.2 Zona del humano (el humano escribe código)

- `apps/web/src/**` (componentes, páginas, hooks, bootstrap).
- `recipes/*/react/**`.
- `recipes/*/content.*.mdx`.
- `recipes/*/meta.ts`.
- `packages/probe-react/**`.
- `spikes/react-probe/**`.
- `docs/CONSTITUTION.md` (ver §7).
- `docs/IDEA.md`.

### 4.3 Zona compartida

- `recipes/*/angular/**`: el agente PUEDE redactar un borrador; el humano
  lo valida y es el responsable final.
- `docs/**` salvo `docs/CONSTITUTION.md` y `docs/IDEA.md` (spec, plan, tareas): el agente
  PUEDE redactar; el humano valida.
- `README.md`: el agente PUEDE redactar instalación y scripts; las
  secciones de decisiones de arquitectura las escribe el humano.

### 4.4 Reglas de zona

- En la zona del humano el agente actúa SOLO como revisor: PUEDE leer,
  criticar, señalar antipatrones o vicios heredados de Angular y proponer
  alternativas explicadas. NO DEBE crear ni modificar ficheros allí, ni
  siquiera para "arreglos pequeños", salvo autorización explícita del
  humano en esa misma sesión y para ese fichero concreto.
- Todo fichero que contenga código React (JSX/TSX que use React) lo
  escribe el humano, esté en la ruta que esté.
- Si una tarea cruza zonas, el agente hace su parte y deja la del humano
  descrita como pasos pendientes, sin implementarla.
- Un fichero no cubierto por 4.1–4.3 DEBE asignarse a una zona en la
  tarea que lo crea, antes de escribirlo.
- Directorios generados (`node_modules`, `dist`, `apps/web/public/ng`) NO
  DEBEN editarse a mano; los producen los scripts.

## 5. Flujo de trabajo

- Cada sesión DEBE abordar una sola tarea, definida antes de empezar.
- El agente DEBE mostrar el diff completo al terminar.
- El agente NO DEBE ejecutar `git commit` ni `git push`. El commit lo hace
  siempre el humano, tras revisar el diff.
- Los spikes van en `spikes/`, son desechables, NO DEBEN aparecer en
  `pnpm-workspace.yaml`, NO DEBEN ejecutarse en CI y NO DEBEN importarse
  desde el monorepo. Los principios de §2 no les aplican.

## 6. Versiones

- `react`, `react-dom`, `react-scan`, `bippy`, `@babel/standalone`,
  `babel-plugin-react-compiler` y todos los paquetes `@angular/*` DEBEN declararse
  con versión exacta (sin `^` ni `~`) en todo `package.json` del monorepo,
  porque las sondas dependen de APIs internas.
- Cambiar cualquiera de esas versiones DEBE ser una tarea propia que
  incluya la revalidación de ambas sondas (`packages/probe-react` y
  `packages/probe-ng`) en la misma sesión.

## 7. Gobernanza

- Solo el humano modifica este fichero. El agente PUEDE proponer cambios
  en el chat.
- Cada cambio DEBE añadir una línea fechada al changelog del final.

## 8. Decisiones abiertas

- Ninguna por ahora.

---

## Changelog

- 2026-09-28 — Creación. Borrador del agente; revisado y corregido por el humano.
- 2026-09-29 — Idioma decidido: español por defecto, contenido preparado para varios idiomas (P8).
- 2026-09-29 — §6: `@babel/standalone` y `babel-plugin-react-compiler` pasan a versión exacta (el toggle React Compiler depende de su salida y de ajustes internos del plugin).
