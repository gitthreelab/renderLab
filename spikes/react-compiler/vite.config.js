import { defineConfig } from 'vite';

// El spike lee la sonda ya empaquetada del monorepo (solo lectura, ?raw).
export default defineConfig({
  server: { port: 5199, strictPort: true, fs: { allow: ['../..'] } },
  preview: { port: 5198, strictPort: true },
  build: { chunkSizeWarningLimit: 10000 },
});
