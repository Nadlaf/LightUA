import { createBrowserRouter } from 'react-router';

import App from '@/App';

/**
 * Derived from Vite's `base` so the router and the build config cannot drift.
 *
 * The trailing slash is stripped deliberately: React Router preserves it if
 * given, and while basename "/LightUA/" matches the URL "/LightUA/", the
 * pathname "/LightUA" then fails its startsWith check, strips to null, matches
 * no route, and renders a blank page. GitHub Pages normally redirects to add the
 * slash, but relying on a server redirect to cover a config choice is fragile.
 */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
    },
  ],
  { basename },
);
