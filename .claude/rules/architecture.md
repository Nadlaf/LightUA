# Architecture

## Stack

| Concern | Choice |
|---|---|
| Build | Vite 8 (`@vitejs/plugin-react`) |
| UI | React 19 |
| Language | TypeScript 6 (pinned `~6.0.3`) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Server state | TanStack Query v5 |
| Routing | React Router v8, **library mode** (`createBrowserRouter`) |
| HTTP | hand-written `fetch` wrapper — no Axios |
| i18n | `i18next` + `react-i18next` |
| Icons | `lucide-react` v1 (brand icons removed in v1; `GithubIcon` is a local inline SVG) |

There is no test runner, no forms library, no auth, and no global state container.

## Path alias

`@/*` → `src/*`. Declared in **both** places, which must stay in agreement:

- `tsconfig.app.json` → `compilerOptions.paths` (standalone `paths`, no `baseUrl` — `baseUrl` is
  deprecated in TS 6 and removed in TS 7)
- `vite.config.ts` → `resolve.alias`

Use `@/…` for cross-feature imports; relative paths within a feature are fine.

## Directory structure

```
src/
  main.tsx              root, providers (QueryClient, Router), side-effect imports
  App.tsx               shell: Header + page + Footer, theme wiring
  routes.tsx            createBrowserRouter, basename
  api/                  transport + server DTOs (see below)
  components/
    ui/                 presentational primitives, no feature knowledge
    layout/             Header, Footer
  features/
    <feature>/
      <Feature>Page.tsx
      components/       feature-specific components
      hooks/            feature data + URL hooks
      lib/              pure domain logic
      types.ts          domain models for this feature
  lib/                  cross-feature helpers (date, theme)
  i18n/                 resources + init + type augmentation
  styles/index.css      Tailwind entry, palette, theme mapping
  types/ui.ts           shared UI enums
dev/                    dev-only Vite plugins (never in the bundle)
fixtures/               JSON served by the dev fixture API; not published
```

`dev/` is type-checked by `tsconfig.node.json`, not `tsconfig.app.json`.

## API layer

Hand-written and safe to edit — nothing here is generated.

- `api/types.ts` — server DTOs, **snake_case preserved**, mirroring the wire format. These mirror
  what the network actually returns, not any in-repo backend definition.
- `api/http.ts` — `apiFetch` / `apiFetchOrNull`, `ApiError` with a machine-readable `code`.
- `api/schedules.ts` — endpoint functions. One `getSchedule(channelId, when)` covers today,
  tomorrow and a historical date via `ScheduleWhen`.
- `api/queries.ts` — `queryOptions` factories and the key factory.

**`getSchedule` deliberately never filters by queue.** The caller needs every queue to populate its
selector, the server answers 404 for an unknown queue rather than returning empty, and an
unfiltered request is what makes `(region, day)` a complete cache key. Adding a queue argument
without putting it in the key would collide two queues onto one cache entry; putting it in the key
would forfeit the sharing that makes a search cost zero requests.

Domain conversion (DTO → model) happens in feature hooks via TanStack's `select`, not in `api/`.

## State management

- **Server state:** TanStack Query only. No Context provider, no store.
- **Submitted search:** the URL query string (`region`, `queue`, `date`).
- **Draft form input:** local `useState` inside `ScheduleForm`. The submit button is what promotes
  a draft into the URL, which is why the result panel does not react to every keystroke.
- **Theme:** `useTheme()` in `lib/theme.ts` — `localStorage` if the user has chosen, otherwise
  `prefers-color-scheme` with a `matchMedia` listener.

`QueryClient` defaults live in `main.tsx`: **`retry: false`** — the tomorrow endpoint legitimately
404s for most of the day, and retrying turned every region change into five requests with seconds
of backoff.

**Derive during render, do not sync with effects.** `eslint-plugin-react-hooks` v7 enforces this
via `react-hooks/set-state-in-effect`. Region-scoped data is stored tagged with the region it
belongs to and ignored when it does not match the current one, so a slow response cannot paint
over a newer selection.

## Routing

Single route (`/`) rendering `App`. React Router is used for its URL primitives more than for
navigation.

`basename` comes from `import.meta.env.BASE_URL` **verbatim, trailing slash included** — see the
constraint in `CLAUDE.md`. The slashless pathname is a server concern: GitHub Pages redirects it,
and `dev/base-redirect.ts` reproduces that 301 locally because Vite's dev server does not.

`useScheduleParams` owns the query string and **validates inbound values** (`region` a positive
integer, `queue` matching `N` or `N.N`, `date` a real ISO date). Anything malformed is dropped
rather than sent to the API, so a mistyped shared link shows the empty state instead of an error.

## Layouts

No layout routes. `App.tsx` is the shell: `Header`, the page, `Footer`, in a flex column with
`min-h-screen`. Horizontal gutters come from the `page-container` utility.

## Internationalization

Ukrainian only, but all copy is centralised.

- `i18n/uk.ts` — every user-facing string, one `as const` object.
- `i18n/index.ts` — init with resources bundled inline, so startup is synchronous and no
  `Suspense` boundary is needed.
- `i18n/i18next.d.ts` — augments `CustomTypeOptions`, so **an unknown `t()` key is a compile
  error**.

Reuse an existing key when the same sentence is meant; add a new one when the meaning differs even
if the words currently match. Never put Ukrainian prose in `api/` — the transport layer returns an
`ApiError.code` or a typed reason, and the UI maps it to a key.

## Forms

No form library. Native `<form onSubmit>` with local state and inline validation that sets a single
error string. `Select` binds its label with `useId`.

## Auth

None. No tokens, no login, no protected routes. Do not introduce an auth layer without asking.

## Errors and notifications

No toasts. Failures render in place:

- Result panel — `ErrorState` (title + message).
- Form — an inline banner above the fields for region/city load failures, and a line above the
  submit button for validation.

Never use `alert()`, and never `console.*` (ESLint `no-console` is an error). Both existed before
and hid real failures. Missing data is modelled as a value (`ScheduleOutcome`), not thrown —
throwing inside a TanStack `select` is not a documented error path.

## Query keys

Defined only in `api/queries.ts` via `queryKeys`, never inline:

- `['cities']`
- `['schedule', channelId, whenKey]` where `whenKey` is `'today' | 'tomorrow' | '<ISO date>'`

Every consumer of the same day shares one entry, which is what makes a region change cost two
requests and the following search cost none.

## Runtime configuration

`VITE_API_URL` only, read once in `api/http.ts`. Empty means same-origin `/api/*`.

- `.env.development` — empty, so requests hit `dev/fixture-api.ts`, serving `fixtures/`. The app
  runs fully offline.
- `.env.production` — the hosted API origin.
- `.env.example` — documents the variable.
- `.env.*.local` — gitignored; use it to point dev at a real backend.

Typed in `src/vite-env.d.ts` via `ImportMetaEnv`. The `VITE_` prefix is required: Vite only exposes
matching keys to client code, so renaming the variable would need `envPrefix` in `vite.config.ts`.

**Known deferred issue:** `.env.production` uses `http://`, while GitHub Pages serves `https://`,
so the browser blocks every request as mixed content and the deployed site cannot load data. This
needs TLS on the API host or a same-origin proxy and cannot be fixed from the frontend.

## Dev-only plugins

Both live in `dev/`, both `apply: 'serve'`, and the build gate verifies neither reaches the bundle.

- `fixture-api.ts` — serves the five API endpoints from `fixtures/`, reproducing the hosted API's
  envelope *and* its quirk of 404-ing an empty `schedule` object.
- `base-redirect.ts` — 301s `/LightUA` to `/LightUA/`, matching GitHub Pages.

## Deployment

GitHub Actions → GitHub Pages, `base: '/LightUA/'`. The workflow lints, builds, then copies
`index.html` to `404.html` as an SPA fallback. `npm run preview` cannot verify that fallback —
Vite's preview server has its own history fallback, so the step passes whether or not it exists.
