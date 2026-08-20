import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { baseRedirect } from './dev/base-redirect.ts';
import { fixtureApi } from './dev/fixture-api.ts';

// Required for GitHub Pages: sets the base path to the repository name.
// Also the source of the router's basename, via import.meta.env.BASE_URL.
const BASE = '/LightUA/';

// https://vite.dev/config/
export default defineConfig({
  // fixtureApi and baseRedirect are dev-only (apply: 'serve'), so neither
  // reaches the production bundle
  plugins: [react(), tailwindcss(), fixtureApi(), baseRedirect(BASE)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: BASE,
});
