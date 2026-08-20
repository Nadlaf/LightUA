# Code Style

Complements the global style rules; this file covers what is specific to this repo.

## Formatting

**There is no Prettier configuration in this repo** — no `.prettierrc`, no `prettier` key in
`package.json`, and Prettier is not a dependency. Nothing enforces formatting automatically, so
match the surrounding file rather than assuming a formatter will normalise it.

Observed conventions in `src/`:

- single quotes, semicolons, trailing commas in multi-line literals
- 2-space indent
- ~100 column soft wrap
- arrow functions with parenthesised parameters

Note the inconsistency: root config files (`eslint.config.js`) use **no semicolons**, while
everything under `src/` and `dev/` uses them. Follow whichever file you are editing.

**Line endings:** `.gitattributes` sets `* text=auto`, so Git normalises to LF on commit and checks
out CRLF on Windows. Files predating the refactor are CRLF on disk, newer ones LF. When patching a
file programmatically, detect and preserve its existing endings — a whole-file ending flip produces
a diff touching every line.

## ESLint

Config: `eslint.config.js` (flat config, ESLint 10).

Type-aware linting is enabled via `tseslint.configs.recommendedTypeChecked` with
`parserOptions.projectService`, and is **scoped to `**/*.{ts,tsx}`**. Applying it globally breaks on
plain `.js` files, which have no type information — `eslint.config.js` itself is the one that fails.

Enabled rules worth knowing:

- **`no-console`: error.** Use inline error UI, never logging.
- **`@typescript-eslint/no-unused-vars`: error.** The previous config had a
  `varsIgnorePattern: '^[A-Z_]'` escape hatch that silently allowed unused capitalised bindings; it
  is gone.
- **`simple-import-sort/imports` and `/exports`: error.** Ordering is autofix-only — run
  `npx eslint . --fix` rather than hand-sorting. Because the hook that formats on write strips
  unused imports, add an import in the *same* edit as its usage, with the usage written first.
- **`react-hooks/set-state-in-effect`** (new in `eslint-plugin-react-hooks` v7). Calling `setState`
  synchronously in an effect body is an error. Derive during render instead — see the state
  management section of `architecture.md`.
- **`@typescript-eslint/no-misused-promises`.** An `async` function cannot be passed where a
  `void`-returning handler is expected. Wrap it: a sync handler that calls `void doAsync()`.
- **`react-refresh/only-export-components`** via `reactRefresh.configs.vite`.

`eslint-plugin-jsx-a11y` is **not** installed: its peer range stops at ESLint 9 and there is no
v7. Accessibility is maintained by hand — see below. Revisit if upstream adds ESLint 10 support.

## TypeScript

- `strict`, plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`,
  `noUncheckedSideEffectImports`.
- Two projects: `tsconfig.app.json` (`src`, DOM libs) and `tsconfig.node.json` (`vite.config.ts`
  and `dev/**`, Node types, no DOM). `tsc -b` builds both.
- No `baseUrl` — deprecated in TS 6, removed in TS 7. `paths` works standalone.
- Model expected-but-empty outcomes as values (discriminated unions), not exceptions. Reserve
  `Error` subclasses for genuine faults.

## Tailwind

- **Use theme tokens, never raw hex.** `bg-card`, `text-main`, `text-muted`, `border-edge`,
  `bg-element`, `text-accent`, `text-success`, `text-danger`, `bg-status-on-bg` /
  `bg-status-off-bg` and their `-fg` pairs, `shadow-card`.
- Tokens are exposed through `@theme inline`, which keeps the `var()` reference in the generated
  utility. That is why they follow `[data-theme]` automatically and **why you do not need `dark:`
  on a token.** Reserve the `dark:` variant for genuine one-offs.
- Preserve exact original values with arbitrary syntax (`text-[1.05rem]`, `size-[42px]`) rather
  than snapping to the nearest scale step, unless a visual change is intended.
- Layout breakpoints are `min-[900px]:` and `min-[1100px]:`, matching the original design — not
  Tailwind's `md:`/`lg:`.
- **Never add a plain unlayered CSS class for layout.** Unlayered CSS outranks every `@layer` rule
  regardless of specificity or order, so it silently beats utilities. A `.container` class doing
  `padding: 0 20px` once zeroed the vertical padding utilities on the same element. Use `@utility`
  (see `page-container`).
- `::backdrop` does not reliably inherit custom properties — keep its colours literal.

## Components

- Presentational primitives live in `components/ui/` and must not import from `features/`.
- **Explicit variant unions, not boolean props.** `<Button variant="primary">`, not `isPrimary`.
  `ghost` and `icon` are intentionally minimal so callers supply colour and size via `className`.
- Compound components are assembled with `Object.assign` (`Modal.Title`, `Card.Header`), which
  types correctly on an arrow-function component.
- React 19: no `forwardRef` — `ref` is a normal prop. Prefer `use()` over `useContext()`. Context
  providers are `<Ctx value={…}>`, without `.Provider`.
- Co-locate component-specific types in the feature's `types.ts`.

## Accessibility

Maintained by hand, since `jsx-a11y` cannot run. When touching UI:

- bind every label to its control (`htmlFor` + `useId`)
- give icon-only buttons an `aria-label`; `title` alone is not an accessible name
- CSS-drawn visuals (the `conic-gradient` charts) need `role="img"` and an `aria-label` stating
  the value, or they are invisible to a screen reader
- toggle buttons need `aria-pressed`; groups need `role="group"` with a label
- prefer the native element that already behaves correctly — `Modal` uses `<dialog>` for Escape,
  focus trapping and focus restoration rather than reimplementing them
