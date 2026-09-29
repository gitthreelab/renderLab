import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// ng-host dev server (apps/ng-host, `ng serve` with baseHref /ng/).
const NG_HOST_DEV_SERVER = 'http://localhost:4300';

export default defineConfig({
  plugins: [react()],
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