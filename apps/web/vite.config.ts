import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// ng-host dev server (apps/ng-host, `ng serve` with baseHref /ng/).
const NG_HOST_DEV_SERVER = 'http://localhost:4300';

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
    { enforce: 'pre', ...mdx() },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    ngHostPreviewFallback(),
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
