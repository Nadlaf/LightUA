import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { fixtureApi } from './dev/fixture-api.ts';

// https://vite.dev/config/
export default defineConfig({
  // fixtureApi is dev-only (apply: 'serve'), so it never reaches the production bundle
  plugins: [react(), fixtureApi()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Required for GitHub Pages: sets the base path to the repository name
  base: '/LightUA/',
});
