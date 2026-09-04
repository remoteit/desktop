# Release process

How a desktop release gets built, published and pointed at.

## What ships

One version bump feeds four targets, each released on its own:

| Target            | Released by                                          |
| ----------------- | ---------------------------------------------------- |
| **Desktop**       | **Build / Electron**, then **Copy / Electron to S3** |
| **iOS**           | **Build / iOS** → TestFlight → submit for review     |
| **Android**       | **Build / Android** → Play internal track → promote  |
| **app.remote.it** | Fast-forward the `release` branch                    |

Do the version bump once, then run whichever targets you are shipping.

## Desktop: two channels, one release

A desktop release reaches users two ways, and they are controlled separately:

| Channel                                                   | Source                                                              | Controlled by                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| **In-app auto update**                                    | The GitHub release itself — `AutoUpdater` uses `provider: 'github'` | Whether the release is marked **Latest** or **Pre-release** |
| **Download page** (`downloads.remote.it/desktop/latest/`) | S3, via the **Copy / Electron to S3** workflow                      | The bucket routing rule that job repoints                   |

A release marked **Pre-release** is only offered to users who have opted in
(`allowPrerelease` in preferences), and its S3 upload never becomes `/latest`.
That is the whole difference between a beta and a public release — a
pre-release that is never promoted is invisible to everyone else.

## 1. Bump the version

From `main`, with everything merged and CI green:

```bash
npm version patch
```

Convention: the **minor** is bumped when a release line opens; subsequent
public releases on that line are **patch** bumps.

One command is enough. A `version` lifecycle script in the root `package.json`
fans the number out and stages everything, so the bump lands as a single commit
titled with the version (e.g. `3.47.0`):

| File                                              | Updated by                                            |
| ------------------------------------------------- | ----------------------------------------------------- |
| `package.json`                                    | `npm version`                                         |
| `frontend/package.json`, `electron/package.json`  | `npm version --workspaces`                            |
| `package-lock.json`, `electron/package-lock.json` | the `npm install` in `version.sh`                     |
| `ios/App/App.xcodeproj/project.pbxproj`           | `version.sh` — marketing version, and build number +1 |
| `android/app/build.gradle`                        | `version.sh` — `versionName`, and `versionCode` +1    |

Both lockfiles matter: `npm ci` fails in CI if only one is regenerated.

Then push the commit and the tag `npm version` created.

## 2. Desktop: build

Run **Build / Electron** (`workflow_dispatch`) — `brand` defaults to `remoteit`,
and **uncheck `skip_signing`** for a real release, since it defaults to `true`.

It builds a matrix of ubuntu-latest / macos-14 / windows-latest, reads the
version from `package.json` (not from the tag), and attaches the installers to
the GitHub release for that tag. Node comes from `.nvmrc` — electron-builder
needs Node >= 20.19 / 22.12, so don't pin it lower.

Windows ships three installers, one per arch (`-ia32`, `-x64`, `-arm64`), and
the job's last step rewrites the update manifests they are listed in — see
[Windows update manifests](#windows-update-manifests). The combined
multi-arch `Remote.It-Installer.exe` is no longer built
(`nsis.buildUniversalInstaller: false`).

## 3. Desktop: write the release notes

Sections, in order — omit any that is empty:

```
### Updates     user-visible features and additions
### Fixes       user-visible bug fixes
### Chore       dependency and CI work
### Includes    bundled binary versions
```

`Includes` comes from `electron/src/backend/binary-versions.json` (`cli` is
listed as `remoteit`). Check it against the previous release — it does not
change every time.

Write notes against the **last release users actually received**, not the last
tag. If the previous release was an unpromoted pre-release, its changes are new
to the public and belong in these notes too.

## 4. Desktop: publish

Mark the GitHub release **Latest** for a public release, or **Pre-release** for
a beta. This is what gates the in-app auto update.

## 5. Desktop: copy to S3

Run **Copy / Electron to S3** (`workflow_dispatch`):

- `tag` — e.g. `v3.47.1`
- `s3_path` — `desktop/`

Three jobs: `validate` gates the inputs before anything is written, `release-s3`
downloads the release assets and uploads them to `desktop/<tag>/`, and
`point-latest` repoints the `/latest` alias — skipped automatically for
pre-release tags (`vN.N.N-something`).

## 6. Desktop: verify

`downloads.remote.it/desktop/latest/version.txt` returns the tag `/latest`
currently serves — the quickest confirmation the alias moved.

## 7. Mobile

Both are `workflow_dispatch` and both take their version from the files the
bump already updated — `ios/App/App.xcodeproj/project.pbxproj` and
`android/app/build.gradle`. `version.sh` increments the iOS
`CURRENT_PROJECT_VERSION` and the Android `versionCode` on every bump, which is
what the stores require: a build number that never repeats.

**Build / iOS** builds and signs the archive, exports the ipa, validates it, and
uploads it to App Store Connect with `altool`. That puts the build in
TestFlight. Submitting for App Store review is a separate manual step in App
Store Connect.

**Build / Android** runs `./gradlew bundleRelease` and uploads the aab to Google
Play with `track: internal`. Promoting from the internal track to production is
a separate manual step in the Play Console.

So neither workflow publishes to the public store on its own — each one gets the
build as far as the store's own staging, and a human promotes it.

## 8. app.remote.it

The web portal deploys from the `release` branch. `release` carries no commits
of its own, so shipping is a fast-forward of `main`:

```bash
git fetch origin
git push origin origin/main:release
```

Pushing `origin/main` rather than a local branch means the deploy is exactly
what is on the remote, with no local checkout to be stale, and no need to switch
branches.

Leave off `--force`. Because this is a plain push, it **fails** if `release`
has commits `main` does not — which is the entire point: a force push cannot
tell "`release` is simply behind" from "`release` has a hotfix nobody merged
back", and quietly destroys the second case. If the push is rejected, look
before doing anything else:

```bash
git log --oneline origin/main..origin/release
```

Empty means it is safe to fast-forward and something else is wrong (branch
protection, most likely). Not empty means there is work on `release` to merge
back into `main` first.

Amplify builds the branch. Its build settings live in the Amplify console, not
in this repo, so there is no `amplify.yml` here to change.

## Windows update manifests

The in-app updater on Windows reads `latest.yml` from the release and picks one
entry from its `files` list. How it picks depends on the electron-updater the
**installed** app was built with — the new release has no say:

| electron-updater | Shipped in            | Picks                                                   |
| ---------------- | --------------------- | ------------------------------------------------------- |
| <= 6.6.2         | every release ≤ 3.46.1 | the **first** `.exe` in `files`, whatever it is         |
| >= 6.6.4         | 3.47.1 onwards        | the first entry whose name contains its own `process.arch`, else the first `.exe` |

electron-builder writes `files` in build-completion order, so "first" changed
between releases. In 3.47.1 it became the multi-arch `Remote.It-Installer.exe`,
which fails on Windows ARM64 — every ≤ 3.46.1 client on ARM64 downloaded it and
hit "The Remote.It agent service could not be installed."

Two things fix that, and both are automatic:

1. **Build / Electron** runs `electron/scripts/finalize-win-update-manifests.js`
   after the Windows build. It reorders `files` to `ia32, x64, arm64` — ia32
   first because it is the one installer that runs on every Windows machine, so
   it is the safe answer for the old clients — drops any entry without an arch
   in its name, checks each entry's `sha512` and `size` against the file it
   names, and re-uploads `latest.yml` with `--clobber`.
2. The same step writes `latest-ia32.yml`, `latest-x64.yml` and
   `latest-arm64.yml`, each listing only that installer. A build running under
   emulation (a 32-bit or x64 app on ARM64, or 32-bit on x64) reports its own
   `process.arch` to electron-updater and would re-install the emulated build
   forever; `AutoUpdater` detects the machine's real arch and sets
   `autoUpdater.channel = 'latest-<arch>'` so it moves to the native installer
   on the next release. Native builds and `allowPrerelease` users stay on
   `latest.yml` — GitHubProvider resolves pre-release tags by channel name, so a
   custom channel cannot be combined with it.

`beta.yml` / `alpha.yml` get the same treatment if electron-builder emits them.

**If a release has the wrong first entry** (a manifest published without the
step, or rolled back by hand): download `latest.yml` from the release, move the
`-ia32.exe` entry to the top of `files`, set the top-level `path` and `sha512`
to that entry's values — change nothing else — and
`gh release upload <tag> latest.yml --clobber`. Clients re-read the manifest on
their next check; a stale download may still sit in
`%LOCALAPPDATA%\remoteit-updater\pending\` and can be deleted.

Note that `downloads.remote.it` serves its HTML download page with **HTTP 200**
for a key that does not exist, so `curl -f` and any status-only check will
happily save that page as `something.exe`. `electron/scripts/verify-binaries.js`
checks the bundled binaries by their magic bytes for this reason; when checking
a download by hand, `file` is the tool, not the status code.

## How the `/latest` alias works

There is no `latest` folder in the bucket and there are no redirect objects.
`desktop/latest/...` is served by a routing rule in the bucket's **static
website config** (S3 → Properties → Static website hosting → Redirection rules):

```
KeyPrefixEquals: desktop/latest → ReplaceKeyPrefixWith: desktop/v3.47.1
```

Two consequences:

- The rule has no `HttpErrorCodeReturnedEquals`, so S3 applies it _before_
  resolving the object. Anything written to `desktop/latest/*` is shadowed and
  never served — which is why the alias is moved by editing the rule.
- It is a prefix rewrite, so one rule covers every asset **and** the
  electron-updater manifests inside the versioned folder
  (`desktop/latest/latest.yml` → `desktop/<tag>/latest.yml`). Nothing needs
  copying to the prefix root.

The rule must already exist for a prefix — `point-latest` fails rather than
creating one, since a new rule means a new product line and is a deliberate act.
The bucket website config is shared across products, so that job is serialized
behind a `downloads-bucket-website` concurrency group and reads back what it
wrote.

Requires `s3:GetBucketWebsite` + `s3:PutBucketWebsite` on the release credentials.
