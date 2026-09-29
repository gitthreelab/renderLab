import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import remarkGfm from 'remark-gfm';
import { runnerImport, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// ng-host dev server (apps/ng-host, `ng serve` with baseHref /ng/).
const NG_HOST_DEV_SERVER = 'http://localhost:4300';
const RECIPES_DIR = fileURLToPath(new URL('../../recipes', import.meta.url));

// Valida recipes/<slug>/package.json al arrancar dev y build: una dependencia sin
// versión exacta, o que intente fijar react/react-dom, para aquí con un mensaje
// claro. El loader del lab repite la validación en runtime (src/recipes/dependencies.ts).
function recipePackagesCheck(): Plugin {
  return {
    name: 'recipe-packages-check',
    async buildStart() {
      // Node no puede importar @render-lab/protocol directamente (TS con imports
      // sin extensión): runnerImport lo carga con la resolución de Vite.
      const { module: protocol } =
        await runnerImport<typeof import('@render-lab/protocol')>('@render-lab/protocol');
      const errors: string[] = [];
      for (const slug of readdirSync(RECIPES_DIR)) {
        const file = join(RECIPES_DIR, slug, 'package.json');
        if (slug.startsWith('_') || !existsSync(file)) continue;

        this.addWatchFile(file);
        let json: unknown;
        try {
          json = JSON.parse(readFileSync(file, 'utf8'));
        } catch (error) {
          errors.push(`recipes/${slug}/package.json: JSON no válido (${String(error)})`);
          continue;
        }
        const result = protocol.parseRecipePackageFor(slug, json);
        if (!result.ok) errors.push(`recipes/${slug}/package.json:\n${result.error}`);
      }
      if (errors.length > 0) this.error(errors.join('\n\n'));
    },
  };
}

// En preview, las rutas de ng-host sin extensión (p. ej. /ng/_smoke) sirven
// dist/ng/index.html para que las resuelva el router de Angular. En dev lo hace ng serve.
function ngHostPreviewFallback(): Plugin {
  return {
    name: 'ng-host-preview-fallback',
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = (req.url ?? '').split('?')[0] ?? '';
        if (/^\/ng(\/|$)/.test(path) && !/\.[^/]+$/.test(path)) req.url = '/ng/index.html';
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    // MDX antes que React: compila recipes/*/content.<locale>.mdx a JSX y
    // plugin-react le aplica Fast Refresh como a cualquier componente.
    // remark-gfm: tablas de GitHub (las recetas las usan para los números medidos).
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm] }) },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    ngHostPreviewFallback(),
    recipePackagesCheck(),
  ],
  resolve: {
    // El MDX de recipes/ está fuera de apps/web: sus imports implícitos de
    // react/jsx-runtime se resuelven desde aquí (una sola copia de React).
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '^/ng(/|$)': {
        target: NG_HOST_DEV_SERVER,
        ws: true,
      },
    },
  },
  // Sin proxy en preview: /ng/ se sirve desde el build (dist/ng).
  preview: {
    proxy: {},
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
});
