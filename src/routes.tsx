import { createBrowserRouter } from 'react-router';

import App from '@/App';

/**
 * Vite's `base` verbatim, so the router and the build config cannot drift.
 *
 * The trailing slash must be kept. React Router preserves it deliberately, and
 * it applies to generated URLs as well as matching: with basename "/LightUA",
 * navigating to the "/" route emits "/LightUA?region=..." with no slash, which
 * does not match the server's configured base of "/LightUA/". Reloading such a
 * URL fails before the app ever boots.
 *
 * The slashless pathname is handled a layer down, by the server. GitHub Pages
 * redirects "/LightUA" to "/LightUA/" for directory paths; Vite's dev server
 * does not, so dev/base-redirect.ts supplies the same behaviour locally.
 */
const basename = import.meta.env.BASE_URL;

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
    },
  ],
  { basename },
);
