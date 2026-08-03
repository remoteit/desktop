# Remote.It Product UI — how to build with this system

The product UI for the Remote.It desktop/mobile app: React 18 on **MUI 5**.
Styling is **CSS-in-JS (emotion)** — there is no utility-class vocabulary and
almost no static stylesheet. Everything visual comes from the theme object.

## Wrapping (required)

Every component reads palette, spacing and typography from React context. Wrap
your tree **once** at the root in `DesignSystemProvider` — it installs the app's
real MUI theme plus `CssBaseline`:

```jsx
<DesignSystemProvider>
  <YourScreen />
</DesignSystemProvider>
```

Pass `dark` for the dark theme: `<DesignSystemProvider dark>`. Without this
wrapper components still mount, but with stock MUI defaults — wrong blues, wrong
spacing, wrong type scale. That failure is silent, so check the wrapper first if
a screen looks generic.

## The styling idiom

**No CSS classes.** Style with MUI's `sx` prop, referencing theme tokens by
name. Colors are palette entries, so they resolve as `'<name>.main'`:

```jsx
<Box sx={{ color: 'grayDarker.main', bgcolor: 'primaryHighlight.main', p: 2 }} />
```

### Palette names

| Group | Names |
|---|---|
| Brand / primary | `primary` `primaryDark` `primaryLight` `primaryLighter` `primaryHighlight` `primaryBackground` `brandPrimary` `brandSecondary` `calm` |
| Success | `successLight` `success` `successDark` |
| Danger / warning | `danger` `dangerLight` `warning` `warningLightest` `warningHighlight` |
| Grays | `grayLightest` `grayLighter` `grayLight` `gray` `grayDark` `grayDarker` `grayDarkest` |
| Absolutes | `black` `white` `alwaysWhite` `darken` `screen` `shadow` |
| Accents | `rpi` `guide` `test` |

Brand blue is `primary` = **#0096e7**; the deep secondary is `primaryDark`
= #034b9d.

**The one trap worth memorizing:** `black` and `white` are *semantic*, not
literal — in the dark theme `black` is `#fff` and `white` is `#202124`. Use them
for foreground/background that should flip with the theme. When you need
literal white in both themes (text on a solid brand fill), use `alwaysWhite`.

### Spacing and type

Both use the same named scale — `bug`, `xxxs`, `xxs`, `xs`, `sm`, `base`, `md`,
`lg`, `xl`, `xxl`, `xxxl`, `max`:

- `spacing` — px values from 1 to 96. Import `spacing` and use it directly
  (`p: \`\${spacing.md}px\``) or use MUI's numeric `sx={{ p: 2 }}`.
- `fontSizes` — rem values from 0.4375rem (7px) to 4rem (64px). `base` is
  0.875rem / 14px, the default body size — this is a **dense product UI**, not a
  marketing page. Don't reach for 16px+ body text.
- `radius` — `sm: 7`, `lg: 14`. On non-Apple platforms these are flattened to
  2/3 at runtime, deliberately.

## Icons

`<Icon />` wraps Font Awesome. `name` is the kebab FA name; `size` takes the
same named scale as the type ramp; `color` takes any palette name above.

```jsx
<Icon name="wifi" size="lg" color="primary" />
<Icon name="docker" type="brands" />
```

`type` is exactly `'light' | 'regular' | 'solid' | 'brands'` — nothing else.
`brands` is a separate family, not a weight: it only resolves for brand names
(`docker`, `apple`, `ubuntu`, `raspberry-pi`), never for a UI glyph.

**Only a curated icon subset ships.** The bundle registers the icons the product
actually uses plus a common-UI set (~210 per weight), not all of Font Awesome —
the full Pro packs blow past the upload size limit. An unregistered name renders
as a placeholder box. Prefer names you can see used in the component previews.

## Where the truth lives

- `_ds_bundle.js` is self-styling — component CSS is injected at runtime by
  emotion, so `styles.css` is nearly empty. Do not go looking for a stylesheet
  to read; the design language is in the theme object.
- Per-component API: `components/general/<Name>/<Name>.d.ts`. These are real
  extracted contracts — trust the prop names and unions in them.
- Per-component usage: `components/general/<Name>/<Name>.prompt.md`, and the
  preview cards themselves, which are built from realistic product data.

## Idiomatic example

```jsx
<DesignSystemProvider>
  <div style={{ maxWidth: 560 }}>
    <Notice severity="warning" gutterBottom>
      This device hasn’t checked in for 6 days.
    </Notice>

    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <ListItemSetting
        toggle
        icon="power-off"
        label="Launch on startup"
        subLabel="Start Remote.It when you sign in"
      />
      <ListItemSetting
        icon="clock"
        label="Idle timeout"
        subLabel="Close the connection after inactivity"
        secondaryContent={<span style={{ fontSize: 13 }}>15 min</span>}
      />
    </ul>
  </div>
</DesignSystemProvider>
```

Note the plain `<ul>`: the `ListItem*` family renders `<li>` elements, so they
need a list parent — but any `<ul>` will do, and MUI's `List` is not required.
