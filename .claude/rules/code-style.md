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

`eslint-plugin-jsx-a11y` is **not** installed, and this is a rejection rather than an oversight.
Latest is 6.10.2 and its peer range is `eslint ^3 || … || ^9`, against this repo's `eslint ^10.8.1`.
It does not degrade to a warning — `npm i` fails `ERESOLVE`, so landing it needs a committed
`overrides` entry, and the Pages workflow's `npm ci` is strict about exactly that. That is a
permanent forced-peer entry plus a live CI failure mode in exchange for enforcing rules the manual
pass already covers. Accessibility is maintained by hand — see below. Revisit only if upstream
ships real ESLint 10 support; do not force it with `overrides`.

## TypeScript

- `strict`, plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`,
  `noUncheckedSideEffectImports`.
- Three projects: `tsconfig.app.json` (`src`, DOM libs, test files excluded),
  `tsconfig.node.json` (`vite.config.ts` and `dev/**`, Node types, no DOM) and
  `tsconfig.test.json` (`src/**/*.test.ts`, Node types, `allowImportingTsExtensions`). `tsc -b`
  builds all three. The test project exists so `node:test` imports and `.ts` import specifiers
  stay out of the app's type environment.
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
- **Use the named breakpoints; there are no arbitrary `min-[…]:` variants left in `src/`.** The
  scale is redefined in a plain `@theme` block in `index.css` to the values this design actually
  uses: `xs` 425, `sm` 768, `md` 1024, `lg` 1440, `xl` 2560. `2xl` is removed
  (`--breakpoint-2xl: initial`) because its 1536px default would sit *below* `lg` and silently apply
  at a narrower width; an accidental `2xl:` therefore generates nothing rather than misbehaving.
  Breakpoints must live in `@theme`, not `@theme inline` — the variant generator reads
  `--breakpoint-*` from real theme variables, and `inline` would copy literals into utilities.
  Note `page-container` caps width at 1440px, exactly `lg`, so above that breakpoint the container
  is fixed rather than fluid.
- **Never add a plain unlayered CSS class for layout.** Unlayered CSS outranks every `@layer` rule
  regardless of specificity or order, so it silently beats utilities. A `.container` class doing
  `padding: 0 20px` once zeroed the vertical padding utilities on the same element. Use `@utility`
  (see `page-container` and `focus-ring`).
- `::backdrop` does not reliably inherit custom properties — keep its colours literal.
- **`@theme inline` tokens cannot be overridden in a media query.** `inline` copies the literal
  value into the generated utility instead of leaving a `var()` reference to the theme variable, so
  reassigning `--animate-modal-in` under `@media (prefers-reduced-motion)` does nothing at all. Add
  a second token and switch between them by variant — which is why `--animate-fade-in` exists.
  (Palette tokens still flip, because *their* values are themselves `var()` references.)
- **Class names written in documentation become real CSS.** Tailwind v4's automatic source detection
  scans every tracked non-ignored file, markdown included, so a class merely *quoted* in a rule file
  or in `CLAUDE.md` gets generated and shipped. This bit exactly once: an anti-pattern example
  reading `motion-reduce:hover:scale-100` put a `.motion-reduce\:hover\:scale-100:hover` rule in the
  production bundle even though `scale-100` appears nowhere in `src/`. `index.css` therefore carries
  `@source not '../../.claude'` and `@source not '../../CLAUDE.md'` — 1.19 kB of dead CSS removed.
  Keep those lines. Without them a style guide cannot name a class without shipping it.
  **Test files are the same hazard.** An assertion message reading `'touching ranges must collapse
  into one segment'` put `.collapse{visibility:collapse}` in the production bundle — any bare word
  that happens to be a Tailwind utility (`collapse`, `contents`, `grid`, `table`, `fixed`, `truncate`,
  `visible`) does this from a plain English string. Hence `@source not '../**/*.test.*'`. Prose in a
  test name is not inert. The same applied to `.github/workflows/*.yml`, where the `contents: read`
  permission line emitted `.contents{display:contents}`; `@source not '../../.github'` closes that.
- **Prose in a `src/` comment is the same hazard, and there is no `@source not` escape for it** —
  source files must be scanned, so this one can only be avoided by wording. A JSDoc line in
  `Button.tsx` reading "declares no transition … with a hover colour or transform" emitted
  `.transition{…}` and `.transform{…}`, adding ~950 bytes to the bundle. `.transition` in
  particular is expensive: it expands to the whole default property list plus its `--tw-*`
  declarations. When a comment must name a utility, name a **real one that already exists in the
  file** (`transition-colors`, `motion-safe:hover:scale-105`) rather than the bare namespace word.
  Check `dist/assets/*.css` byte size after editing comments — a jump means prose leaked.
- **Gate motion with `motion-safe:`, not `motion-reduce:`.** Both are built in. Prefer
  `motion-safe:hover:scale-105` over `hover:scale-105 motion-reduce:hover:scale-100` — gating one
  rule beats undoing it. Only transforms need gating; colour and opacity transitions are fine as-is,
  which is why the many `transition-colors` / `transition-[background]` sites are untouched.
- **A variant must not declare a property a caller is expected to override.** `Button` composes
  `BASE` + `VARIANTS[variant]` + a caller's `className` by string concatenation with no conflict
  resolution (no `tailwind-merge`). When two classes set the same property, the one Tailwind emits
  later in `@layer utilities` wins — and **that order is Tailwind's own internal candidate
  ordering, which you cannot derive from the class string.** Do not try. It is neither alphabetical
  nor numeric in general: this bundle emits `transition-[background] · transition-all ·
  transition-colors` (which happens to match ASCII) but `py-1.5 · py-2.5 · py-3 · py-3.5 · py-4 ·
  py-10 · py-[15px]` (numeric, then arbitrary — ASCII would put `py-10` second). Whoever wins is
  therefore an accident, not a decision.
  Two concrete traps this produced: `bg-transparent` in a variant is redundant against Preflight's
  own `background-color: transparent` on buttons, so it did nothing but defeat a caller's `bg-*`;
  and `transition-colors` in `BASE` silently beat callers' `transition-all`, which stripped
  `transform` from the transition and made `motion-safe:hover:scale-105` snap. You cannot fix that
  second one from the call site — no `transition-[…]` spelling reliably out-ranks it. Remove the
  property from the variant instead.
  **Caveat — this rule is not fully satisfied today.** `primary` and `secondary` still declare
  `px-6 py-2.5 rounded-[10px]`, and `ScheduleForm`'s submit button overrides two of the three. It
  works, but by the same accident. Hoisting padding out of `primary` would force every primary
  caller to redeclare it, which is worse for a component whose job is a finished look — so the
  exposure is accepted and recorded rather than fixed.

## Components

- Presentational primitives live in `components/ui/` and must not import from
  `components/schedule/`, `components/info/`, `hooks/` or `pages/`.
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
- **give every interactive element the `focus-ring` utility.** It is the single source of focus
  styling — do not hand-roll `focus-visible:` utilities per component, and never reintroduce
  `outline-none` (that is what left the selects with a colour-only cue, failing WCAG 1.4.11). Most
  buttons inherit it through `Button`'s `BASE`; anything not routed through `Button` — a native
  `<button>`, `<select>` or `<a>` — needs the class directly.
- **gate transform-bearing animation behind `motion-safe:`**, with an opacity-only fallback. The
  spinner is the deliberate exception: `animate-spin` stays ungated because it is the app's only
  visual loading signal and a static ring reads as broken.
- `role="status"` is on **both** `Spinner` and `EmergencyBanner`, so it is not a usable selector for
  a spinner-specific rule.
