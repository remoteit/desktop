# Platforms

The platform catalogue — names, onboarding routes, install commands — lives in the graphql-api
database. Its design, and the rules a row implies, are documented in that repo:
`graphql-api/docs/PLATFORM-CATALOGUE.md`. This file covers only the desktop side.

## The snapshot

`catalogue.generated.json` is a **build-time snapshot** of the API's `platformTypes` +
`platformInstallations`, produced by `scripts/platforms-generate.mjs` and committed. The app reads
only that file — there is no runtime fetch — so a catalogue change reaches clients when the
snapshot is regenerated and shipped. It is committed rather than fetched at build time because
`catalogue.ts` imports it at module load: generating it during the build would need API
credentials in every build and would make the same commit produce different output depending on
the database.

Regenerate with `npm run platforms:generate` (see RELEASE.md). It is deliberately **not** wired
into CI, for two reasons, of which the credential is the smaller:

1. The snapshot is *meant* to lag the database until someone regenerates and ships, so "differs
   from the API" is the normal state after any row edit, not a fault. As a per-PR gate it would
   turn every open pull request red for a change none of them made.
2. Auth is enforced at the API gateway, not the resolver, so dropping `@Authorized()` would not
   help — a public catalogue would need a new unauthenticated route. The Bearer path takes only
   short-lived JWTs, so no static CI secret can satisfy it either. If this is ever automated,
   `Authorization: Signature` (access key) is the mechanism that needs no new surface.

## What a local platform file owns

A `platforms/<id>/index.tsx` registers its **id and its code** — component, override,
`listItemTitle`, JSX instructions, and the client-capability flags. Everything that is data comes
from the catalogue.

Any **defined** field a local file sets wins over the catalogue, so a hot-fix in a local file
takes effect; an undefined one (a capability flag that is off on this OS) falls through to the
catalogue value. A route the catalogue has no row for — the hidden `android-screenview` deep link
— supplies all of its own data.

## Catalogue data vs client capability

The catalogue holds facts about the **platform**; the desktop holds facts about the **client**.
`installation.link` is catalogue data: where the platform is installed from, which genuinely
differs per row. `oemGuide` and `addThisDevice` are client capabilities — the OEM provisioning
guide is one URL for every platform that shows it (a fact about remote.it), and registering the
machine the app is running on is a capability of the running client, gated on the OS. Both
resolve to constants (`OEM_GUIDE_LINK`, `DEVICE_SETUP_PATH`) rather than per-platform values.

Picker membership and order also stay here: whether *this* client offers a platform, in which
section and in what order, is a client fact. Enumerating the catalogue on `/add` was built and
reverted — it surfaced routes that are not meant to appear, and lost the curated order.

## Type lookups

Three maps, and picking the wrong one is the usual bug:

- `lookup` — type id → route slug, for types that have an `/add` page.
- `nameLookup` — type id → label, for **every** catalogue type, so a legacy device with no page
  still resolves to a real name instead of "Unknown".
- `pageTypes` — the subset of `nameLookup` that has a page. This is what a picker a user chooses
  from should list; `nameLookup` carries ids no page onboards and labels that repeat.

`platforms.name(type)` is the display name for a device of that type. It prefers the type's own
label over the page name, because a page covers several types: type 10 is "Windows Server", not
"Windows", and 1120 is "Debian Linux", not "Linux".

## Translations

Platform copy is English in the database and translated in the `platforms` namespace, keyed by
route slug. The keys are built at render time, so i18next-parser cannot extract them —
`scripts/platforms-generate.mjs` maintains those catalogs instead, the same arrangement the parser
config documents for the `columns.<id>` labels. The catalogue string is always the inline default,
so a platform whose row has not been through the generator still renders its English.
