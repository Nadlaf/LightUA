/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the outage API. Empty means same-origin `/api/*`, which in
   * development is served by dev/fixture-api.ts.
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
