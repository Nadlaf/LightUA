import type { Plugin } from 'vite';

const HTTP_MOVED_PERMANENTLY = 301;

/**
 * Redirects "/base" to "/base/" during development.
 *
 * GitHub Pages does this for directory paths, but Vite's dev server does not —
 * it renders a "did you mean" error page instead, so the app never boots. That
 * makes dev disagree with production, and any link shared without the trailing
 * slash dead-ends locally.
 */
export const baseRedirect = (base: string): Plugin => ({
  name: 'lightua:base-redirect',
  apply: 'serve',
  configureServer(server) {
    const withoutSlash = base.replace(/\/$/, '');
    if (withoutSlash === '') return;

    server.middlewares.use((req, res, next) => {
      const [path, query] = (req.url ?? '').split('?');

      if (path !== withoutSlash) {
        next();
        return;
      }

      res.statusCode = HTTP_MOVED_PERMANENTLY;
      res.setHeader('Location', query ? `${base}?${query}` : base);
      res.end();
    });
  },
});
