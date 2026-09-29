import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['spikes/', '**/dist/', '**/out-tsc/', '**/.angular/', 'apps/web/public/ng/']),
  {
    files: ['**/*.{js,ts,mts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['apps/ng-host/src/**/*.ts', 'recipes/*/angular/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.{js,ts}', 'apps/*/*.{js,ts}', 'apps/ng-host/scripts/**/*.mts'],
    languageOptions: { globals: globals.node },
  },
]);
