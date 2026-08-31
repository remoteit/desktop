# Brand assets

One directory per brand — `remoteit` and `cachengo`. `scripts/brand-electron.sh`
copies the selected brand's `electron/` contents into `electron/build/`, where
electron-builder picks them up. The `BRAND` environment variable or the
workflow's `brand` input selects which one.

```
brands/<brand>/
  electron/
    icons/    -> electron/build/icons   app icons (see below)
    images/   -> electron/build/images   tray and status images
  public/     web assets
  assets/     shared source art
```

## Electron app icons — the filenames are load-bearing

`brands/<brand>/electron/icons/` holds `icon.icns` (the macOS app icon) and a set
of PNGs (the Linux icon set baked into the `.deb`).

Each PNG **must** be named for its true pixel size — `256x256.png`, not
`icon_256x256.png` and not `icon_128x128@2x.png`.

electron-builder collects the directory with:

```js
name.match(/^(\d+)(?:x\d+)?\.png$/i)
```

A name that does not match is skipped **silently**. If every name is skipped the
icon list comes back empty and the Linux build dies several frames later with
`TypeError: Cannot read properties of undefined (reading 'file')` in
`LinuxTargetHelper.computeDesktopIcons` — an error that mentions neither icons
nor filenames.

That is exactly what happened when electron-builder 26.15.3 replaced its Go icon
collector with a JS one and dropped the `icon_NxN.png` form that `iconutil`
emits for a macOS `.iconset`. These files were renamed to suit.

### Adding or regenerating icons

Exporting an `.iconset` from Icon Composer or `iconutil` gives you the
`icon_NxN.png` / `icon_NxN@2x.png` names. **Rename them by actual pixel
dimensions before committing** — an `@2x` file is twice the size in its name
(`icon_32x32@2x.png` is really 64×64, so it becomes `64x64.png`).

Verify a change resolves before relying on CI:

```bash
npm run brand -w=electron   # populates electron/build/icons
node -e "require('app-builder-lib/out/util/iconConverter.js').convertIcon({sources:['icons'],fallbackSources:[],roots:[require('path').resolve('electron/build')],format:'set',outDir:'/tmp/i'}).then(r=>console.log(r.icons.length+' icons'))"
```
