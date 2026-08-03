# design-sync notes — remoteit-desktop-frontend (Remote.It Product)

Project: https://claude.ai/design/p/2b368496-be1b-45aa-a706-f41dfab8dddb

## What this sync is

This repo is an **application**, not a published component library. There is no
`dist/` of components, `noEmit: true`, and components live in
`frontend/src/{components,buttons}` (417 `.tsx`). We sync a **curated 60** that
are genuinely presentational — no direct redux/router/i18n/Capacitor coupling —
selected by import-graph analysis, then hand-reviewed.

`.design-sync/ds-entry.tsx` IS the converter entry: it re-exports those 60 plus
`DesignSystemProvider`. Nothing is reimplemented — the bundle is built from the
shipped source.

`Attribute` is excluded (`componentSrcMap.Attribute: null`) — it's a helper
function `(value, indent) => any`, not a React component.

## The build pipeline (order matters)

`cfg.buildCmd` runs three steps before the converter:

1. `npx tsc -p frontend/tsconfig.json --emitDeclarationOnly --declaration --noEmit false --outDir ds-types --skipLibCheck || true`
2. `node .design-sync/gen-icons.mjs`
3. `node .design-sync/gen-props.mjs`

then

```sh
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry ./.design-sync/ds-entry.tsx --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
```

`--node-modules` is the **repo root** `node_modules` (workspaces hoist react and
@mui there; `frontend/node_modules` does not have them).

The `|| true` on tsc is required: `frontend/src/selectors/ui.ts` emits TS4023
errors ("cannot be named") that do not block declaration emit. Don't chase them.

### Why `ds-types/` exists (and must NOT be dot-prefixed)

The converter's prop extractor reads **`.d.ts` files only** — it never parses
`.tsx`. With `noEmit: true` this repo ships none, so every contract came out as
`[key: string]: unknown`. Emitting real declarations fixes it.

The output dir must be visible: the extractor globs `<root>/**/*.d.ts` through
fast-glob, which **skips dot-directories by default**. An earlier attempt emitted
into `.design-sync/.cache/types/` and was silently ignored (still "parsed 27
.d.ts files"). `ds-types/` at the repo root works (835 parsed).

### Why `gen-props.mjs` exists

The converter looks for a `<Name>Props` type. This codebase overwhelmingly names
it plain **`Props`**, and also uses inline `React.FC<{…}>` literals, imported
prop types, and generic function components. `gen-props.mjs` lifts the real
declared shape out of `ds-types/` and writes `cfg.dtsPropsFor`. Result: **60/60
components have genuine contracts.** Intersections with external types are noted
in the emitted body as `/** Also accepts: ChipProps */` rather than silently
dropped.

### Why `gen-icons.mjs` exists

`Icon.tsx` does `library.add(fal, fab, far, fas)`. The three Pro packs are ~45 MB
each; bundling them whole produced a **15.9 MB `_ds_bundle.js`**, past the 12 MB
upload limit. The generator writes curated shims (`.design-sync/icons/*.ts`)
aliased in via `cfg.tsconfig` paths, bringing the bundle to ~7.5 MB.

**The harvest is deliberately broad, and must stay that way.** It takes *every*
kebab/word string literal in `frontend/src` + `common/src` and keeps whatever
resolves to a real FA file. Narrower versions kept silently breaking icons:

- JSX-attribute-only matching missed assignment forms (`name = 'windows'`) —
  blanked 9 glyphs across EventIcon, InitiatorPlatform, LicensingIcon.
- It also missed `Icon.tsx`'s internal **rewrites** (`share` →
  `arrow-up-from-bracket`, `port` → `neuter`, `host` → `t`, `launch` →
  `arrow-right`, `circle-medium` → `circle`, `scripting` →
  `rectangle-terminal`). These are now parsed out of the source explicitly too.

A missing icon renders as a correctly-sized but **empty** hit target — no glyph,
no console error, nothing the render check can flag. Over-harvesting is free
(non-icons have no file and drop out), so err wide.

Export names are read from each module, never assumed from the filename:
`faRaspberrypi.js` exports `faRaspberryPi`. A mismatch puts `undefined` in the
pack and `library.add()` throws `Cannot read properties of undefined (reading
'prefix')` — which took down all 61 cards once.

## `DesignSystemProvider` — theme + store + router

The shipped provider wraps three things. **All three matter for real designs, not
just preview cards** — a design built in Claude Design with these components
fails exactly the same way without them.

- **MUI theme** (`getTheme(dark)`) — without it, stock MUI defaults. Silent.
- **Redux store** (`.design-sync/ds-store.ts`) — 45 of the 60 reach
  `useSelector`/`useDispatch` somewhere in their import graph, usually via a
  child (GridList → GridListHeader, Tags → Tag → useLabel, Icon → PlatformIcon,
  AgentListItem → useAccountLabel). Without a Provider react-redux throws and
  React unmounts the **entire subtree**, including the plain-HTML scaffolding —
  so it reads as "nothing rendered", not "component rendered empty". The store is
  an inert stub; `dispatch` is a nested Proxy because components destructure
  model slices off it (`const { ui } = useDispatch()`) and call effects.
- **MemoryRouter** — the list/row components render through `ListItemLocation`
  → `useLocation()`, which TypeErrors outside a Router. MemoryRouter (not the
  app's HashRouter) so nothing touches the URL. `route` prop sets the initial
  entry, which is what makes an active/selected row state renderable.

`ds-store.ts` mirrors each model's `defaultState` by hand. Importing the real
models would pull rematch effects, the API client and auth side effects. **If a
component starts rendering blank after a model changes shape, reconcile it
there.**

## Authoring previews (`.design-sync/previews/<Name>.tsx`)

- Import ONLY from `'remoteit-desktop-frontend'` — shimmed to
  `window.RemoteItProduct`.
- **NEVER import `@mui/material` or `@emotion`.** esbuild bundles a second MUI
  instance whose React context differs from the bundle's ThemeProvider, so the
  component renders unstyled. Use plain HTML + inline styles for scaffolding.
  (`react-redux` is the *exception* — it memoizes context on a
  `globalThis[Symbol.for('react-redux-context')]` Map keyed by
  `React.createContext`, and preview + bundle share one React, so a duplicate
  copy still sees the same Provider. MUI has no such registry.)
- `ListItem*`-family components render `<li>` — wrap in a plain
  `<ul style={{listStyle:'none',margin:0,padding:0,maxWidth:560}}>`. MUI's `List`
  is not needed.
- Realistic Remote.It content only — devices, services, ports, plans. Never
  `foo`/`test`.
- Small glyphs and chips must **sweep their variant axis** in a labelled grid
  with an ~11px muted caption per cell. A lone icon on a white card reads as
  blank and fails the rubric.
- Weight-only axes (solid/regular/light) need a large size to read; at `sm` they
  are indistinguishable hairlines.
- In a swept row whose height varies with the swept prop, give the caption well a
  **fixed** height, not `minHeight` — otherwise the sweep becomes a baseline
  stagger (this was the ColorChip overlap).
- Before sweeping a prop, confirm in the source that it reaches a *rendered*
  node. A prop that only feeds a `title`/tooltip is invisible to a static capture
  and must be annotated instead (GraphColumn `resolution`).
- If every branch of a fallback axis collapses to the same output, add one
  non-collapsing variant beside it or the cell looks broken (LicenseChip).

## Known render warns / documented non-issues

Do not "fix" these on a re-sync:

- **18 `[GRID_OVERFLOW]`** warnings are resolved via `cfg.overrides` —
  `cardMode: "column"` for 16 wide components, `cardMode: "single"` for
  `SessionsTooltip` and `TagAutocomplete` (both portal/fixed positioned).
- **`InlineSetting`-based components** (`InlineTextFieldSetting`, `FormDisplay`)
  can never show their edit form in a static capture: `edit` initialises to
  `false` and the affordances live in a hover-only
  `<ListItemSecondaryAction className="hidden">`. `onDelete`, `warning`,
  `resetValue`, `actionIcon`, `placeholder` are wired but invisible. The `debug`
  prop does not open the editor.
- **`ConnectionChecklist`** keeps its checkpoint list in a MUI `Tooltip` `title`
  with no `open` passthrough — only the resting glyph is capturable.
  `SessionsTooltip` *does* forward `open`, which is why its bubbles capture.
- **`LoadMore`'s gray label is correct**, not unthemed: `theme.ts` overrides
  `MuiButton.root.color` to `grayDark`, beating `color="primary"`.
- **`ExpandIcon` in `grayLight` is genuinely near-invisible** on white. That's
  the real token.
- **`DatePicker`'s "red" label** is a contact-sheet downscaling artifact on 12px
  uppercase text; computed style is theme gray, `aria-invalid="false"`.
- Confirm-flavoured buttons only open their dialog on click — unscreenshotable
  by design.
- `ResellerLogo` returns `null` until `new Image()` onload resolves, so previews
  must inline artwork as base64 data URIs; remote URLs render blank.

## Product observations for the team (not sync issues)

Found while building previews — worth a look, but nothing here was changed:

- **`ServiceMiniState`'s `transition` state looks unreachable via `connecting`.**
  The source sets `transition` then immediately overwrites it with `connected`
  whenever `enabled` is true, which it always is while connecting. The
  grayDarkest transition chip only appears on teardown (`stopping` +
  `enabled: false`).
- **`DynamicButton` with `variant="outlined"` and no `color` is invisible** —
  `foreground` defaults to `palette.alwaysWhite.main` and is only recolored for
  `variant === 'text' && background`, giving white-on-transparent with a border
  built from an unresolved palette key string.
- **`ListHorizontal` destructures a `hideIcons` prop and never uses it**
  (`frontend/src/components/ListHorizontal.tsx:11`). Dead prop.
- **`ListHorizontal` truncates past ~8 characters** — items are pinned to
  `width: 100` and `ListItemButton` renders `value` as a 12px monospace `<pre>`
  with `break-word`. At `size="small"`, `'& svg': { minWidth: 60 }` leaves ~22px
  for text (`SSH` → `SS/H`).
- **GridList right-aligned columns lack trailing padding.** The *header* gets
  `marginRight: 18` but `.attribute` data cells get none, so a right-aligned
  value butts against the next column (`5` + `2 min ago` → `52 min ago`).

## Debugging a blank cell

`package-capture` swallows per-cell errors. Recipe that found both real bugs:

```sh
node .ds-sync/storybook/http-serve.mjs ./ds-bundle
```

then open `<Name>.html?story=<Cell>` with `playwright-core` (CJS — needs
`import pw from 'playwright-core'; const { chromium } = pw`) and read console
errors, or screenshot at `deviceScaleFactor: 4` to rule out downscaling
artifacts.

## Re-sync risks — what can silently go stale

- **`ds-store.ts` is a hand-maintained mirror** of `frontend/src/models/*`
  default states. Model shape changes won't error — components just render
  blank. First thing to check if cards go empty.
- **`gen-icons.mjs`'s rewrite parser** matches the exact
  `if (name === 'x') { name = 'y' }` shape in `Icon.tsx`. Refactoring that block
  (a lookup table, a switch) silently drops the targets. The broad string
  harvest covers most of it, but the explicit parse is the safety net.
- **`conventions.md` enumerates real palette names and the `Sizes`/`IconType`
  unions.** If `styling/index.ts` or `types.d.ts` change, re-validate every name
  against the fresh build — a wrong name in the header is worse than no header,
  because the design agent will trust it.
- **`componentSrcMap` is a hand-curated 60 out of 417.** Nothing detects a newly
  added presentational component; re-run the coupling analysis periodically.
- The transitive-redux scan reported 45/60, but most only reach `useSelector` on
  branches not taken with the props used. That's why the store ships globally
  rather than per-preview — a design agent using different props WILL hit those
  branches.
- **Node 22.14.0 / .nvmrc says v22.14.0** — matched.
- Playwright + chromium were installed into `.ds-sync/` this run
  (~200 MB in `~/.cache/ms-playwright`).
