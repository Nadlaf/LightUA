import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Required for GitHub Pages: sets the base path to the repository name
  base: '/LightUA/',
});
