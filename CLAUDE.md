# LightUA

## Role

Public-facing viewer for Ukrainian planned electricity outage schedules ("СвітлоUA").

A visitor picks an **oblast** (region), a **queue** (черга, e.g. `2.1`), and a **day**, and sees
when their power is scheduled to be on or off — as a donut or 24-hour clock chart plus a list of
intervals. Single audience: residents checking their own address. There are no accounts, no roles
and no authenticated areas.

Data comes from a hosted read-only API. This repository is frontend only; the backend is
maintained separately and is not present here.

## Commands

- `npm run lint` — run after every source change.
- `npx tsc -b` — type-check both projects (`src` and `dev`). Faster than a full build.
- `npm run build` — runs `tsc -b && vite build`. Run before declaring a change complete.

Ask before running, because they start servers:

- `npm run dev`
- `npm run preview`

Do not run any other scripts. `npm install` only when adding or changing a dependency, and say
which package and why.

## Constraints

- Do not create circular dependencies between modules.
- Do not put non-frontend files in `public/`. Vite copies that directory into `dist/` verbatim and
  GitHub Pages publishes it. A Python backend once lived there and was served publicly.
- Vite's `base` and the router's `basename` must stay in sync, and the **trailing slash must be
  kept**. `basename` applies to generated URLs as well as matching; stripping it emits
  `/LightUA?...`, which does not match the configured base and breaks on reload.
- `src/features/schedule/lib/timeline.ts` has no test coverage and no visual signal for wrong
  output — a wrong percentage looks plausible. Before changing it, recompute the schedule
  percentage, interval count and first/last interval for a few known region+queue+day
  combinations and compare. Treat `24:00`↔`1440` and the midnight-crossing branch as load-bearing.
- Never add `Co-Authored-By` trailers to commit messages.
- `.env.development` and `.env.production` are runtime config. Do not read them (see
  `.claude/settings.json`); `.env.example` documents the shape.
- Do not commit `config.json` or any `*.session*` file. Both are gitignored and relate to the
  removed backend's Telegram credentials.
- Every interactive element needs the `focus-ring` utility, and every transform-bearing animation
  needs a `motion-safe:` gate. **Nothing in the toolchain checks either** — `eslint-plugin-jsx-a11y`
  is peer-capped at ESLint 9 and cannot be installed, so a control added without `focus-ring` is
  silently unreachable for keyboard users and no lint run will say so.

## API Clients

One client, hand-written on `fetch`. There is no Axios and no generated API layer.

`src/api/http.ts` exposes two functions over the same base URL (`import.meta.env.VITE_API_URL`,
empty meaning same-origin):

- **`apiFetch<T>(path)`** — throws `ApiError` on any non-OK response. Use when the caller needs
  the data and absence is a real failure.
- **`apiFetchOrNull<T>(path)`** — resolves to `null` on 404, throws otherwise. Use for
  availability probes, where "this day has no data" is an expected answer. The API returns 404
  for a day it simply has no schedule for, and the *tomorrow* endpoint legitimately 404s for most
  of the day.

`ApiError` carries a machine-readable `code` (`notFound` / `badRequest` / `server` / `network` /
`unknown`) so the UI picks a translation key rather than rendering server prose.

In development, `/api/*` is served by `dev/fixture-api.ts` from `fixtures/`, not by the hosted
backend. See `.claude/rules/architecture.md`.
