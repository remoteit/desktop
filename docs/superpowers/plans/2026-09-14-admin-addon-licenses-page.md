# Admin → Add-ons: granting the `ai-agent` licence per account

**Goal:** a system-admin page on the desktop that lists, grants and revokes **add-on licences** —
the per-account entitlement that turns the Remote.It AI chat on. `ai-agent` is the first add-on;
the page is generic over add-on products so the next one is a data change on the API, not a page.

**Status (2026-09-14):** built on `feat/admin-addon-licenses` (branched from
`feat/permitteer-login`). The API side shipped earlier and is live on dev and prod — see
graphql-api `docs/AI-AGENT-LICENSE.md` for the model and every decision behind it. This note is the
desktop half: what the page does, where it lives, and how to verify it.

---

## Where things stood before this branch

- **The gate already existed — with a hole.** `useChatEnabled()` reads `limits['ai-agent']`
  through `selectLimitsLookup` (`frontend/src/hooks/useChatEnabled.ts`), the same selector that
  gates `saml`, `roles` and `tagging`. But `PENDING_FEATURES` (`frontend/src/constants.ts`)
  defaulted the flag ON for dev builds and app.ai.remote.it, so there the chat showed with or
  without a licence.
- **The API was done.** graphql-api `main` carries the generic add-on admin surface —
  `admin.addonProducts`, `admin.addonCustomers(product, from, size, search)`,
  `addAddonCustomer(product, email, expiration?)`, `removeAddonCustomer(product, userId)` — with
  `AddonCustomer` shaped like `EnterpriseCustomer` plus `productId` and `expiration`. The `ai-agent`
  product (`96aa515b-cf6b-40bf-8d04-7972cbbc7c39`) with its one `ALPHA` plan carrying the `ai-agent`
  limit is in the shared database. e2e `addon-license.spec.ts` proves the grant → limit → revoke
  round trip on every lane.
- **The desktop already rendered the licence** — `LicensingSetting` draws one card per licence, so a
  granted account showed an "AI Agent Alpha plan" card — but with no feature line under it
  (`LimitSetting` renders nothing for a limit name it does not know) and the r3 brand mark for an
  icon. And there was no way to grant one from the app.

## What this branch adds

### The page: `/admin/add-ons/:productId?`

`frontend/src/pages/AdminAddonLicensesPage/AdminAddonLicensesListPage.tsx`, a clone of the
enterprise-licences page (`AdminEnterpriseLicensesListPage.tsx`) with the product made explicit:

- **The product is in the URL.** `/admin/add-ons` alone redirects to the product last looked at
  (remembered through `ui.defaultSelection['admin']`, the same slot the sidebar's other entries use)
  or else the first add-on the API lists; a link to a product the API no longer lists is bounced the
  same way, and a deep link to a real one is honoured. The Header treats every `/admin/add-ons/*`
  path as a root page (no Back arrow) — the product is the list, not a detail.
- **Header row:** an **Add-on** selector (always shown — one entry today), **Grant Add-on**, and the
  email/name search (committed on Enter, like the other admin lists).
- **Columns:** Account, Devices, Members, Granted, **Expires** (`-` when open-ended; a past date
  reads "Expired <date>" in red — the API keeps the row but skips it in the limits merge until it is
  revoked), and a trash action.
- **Grant dialog:** account email plus an optional **Expires** (`datetime-local`, `min` = now — the
  API refuses a date in the past). Blank is sent as `null`, not omitted: the API leaves an *omitted*
  expiration alone, and re-granting a time-boxed holder from a blank form should give the
  open-ended grant the form shows, not silently keep the old date. Granting an account that already
  holds the add-on is idempotent on the API's side and replaces its expiration.
- **Revoke:** a confirm naming the add-on and the account; the account loses the feature at once
  (the API publishes `LicenseUpdatedEvent`, which the desktop already turns into `plans.updated`).
- **A disabled add-on** (`Product.enabled = false`, the alpha's kill switch) still lists in the
  selector, marked "(disabled)", and its grants can still be revoked — but Grant is hidden, since the
  API refuses new grants for it.
- **Errors:** `graphQLBasicRequest` already shows the API's own message as a snackbar ("User does not
  exist: …", "Add-on is disabled", the Stripe guard). The page does not overwrite it with a generic
  "Failed…" the way the enterprise page does; the grant dialog stays open for a correction.

### Wiring

- `models/adminAddonLicenses.ts` — the catalogue, the selected product and the paginated holder
  list, each with a load STATUS (`idle | loading | loaded | failed`) kept apart from what it last
  delivered, so the page tells "nothing has answered yet" from "nobody holds it". `refresh(urlProduct)`
  is the one way in — on mount, on every move of the URL's product, and from the header's refresh
  button: catalogue first, the selection checked against it (a product the API stopped listing is
  cleared and the page redirects), then the list fetched afresh (a remount can sit over rows from
  another API target — Test Settings switches the stage without a reload). Every request carries a
  latest-wins ticket, so a page that lands after its list was superseded (a product switch, a new
  search, a refresh under a Load More, sign-out) is dropped. Registered in `models/index.ts`, reset
  on sign-out in `models/auth.ts`.
- `services/graphQLRequest.ts` — `graphQLAdminAddonProducts`, `graphQLAdminAddonCustomers`;
  `services/graphQLMutation.ts` — `graphQLAddAddonCustomer`, `graphQLRemoveAddonCustomer`.
- `routers/Router.tsx` (the `/admin/*` block), `components/AdminSidebarNav.tsx` ("Add-ons"),
  `components/Header/Header.tsx` (root-page rule).

### The licence is the only switch

`PENDING_FEATURES`, `CHAT_ALWAYS_ON` and `VITE_CHAT_ALWAYS_ON` are gone (the 2026-08-31 note's
"client cleanup"). `selectLimitsLookup` is built only from the limits the API returns, so an
account without the add-on has no `ai-agent` entry at all — falsy — and nothing chat-related
mounts: no header button, no docked column, no popout (it says "Remote.It AI is not available for
this account"), and the Test page's **AI Agent** section (background work, agent URL) is behind the
same gate, so the agent service is not even asked for the background status. The Test page's
Features list shows only what the licence mentions — an account holding the add-on can switch it
off there; one without it has no row and gets it granted, not toggled. This holds for a dev build
and for app.ai.remote.it alike: a developer's dev account needs the grant too.

### The licence card

- `components/LimitSetting.tsx` — `case 'ai-agent'`: "AI agent is available" when true, and **no
  row at all** when false (the alpha's decision 1: accounts that lack it are shown nothing; the API
  sends no default row, so today the false branch never arrives anyway). Key
  `limitSetting.aiAgentAvailable`, extracted into all four catalogs.
- `models/plans.ts` — `AI_AGENT_PRODUCT_ID`; `components/LicensingIcon.tsx` draws the `remote-ai`
  mark for that product's card.

## Verifying

- `npm run typecheck`, `cd frontend && npm test` (`models/adminAddonLicenses.test.ts` covers the
  model: product switch empties the list, same-product select is a no-op, search is trimmed into the
  request, paging appends from the rows held, a refused request clears the spinner), `npm run
  i18n:check`.
- Driving it: run the frontend against dev (`frontend/.env.local`), sign in as a **system admin**
  (`r3_Users.admin`), Admin → Add-ons. Grant a test account with and without an expiration; on that
  account, Account → License shows the "AI Agent Alpha plan" card with "AI agent is available", the
  header's AI button appears and Test Settings lists `ai-agent`. Revoke → the card, the line, the
  button and the row go, live. Grant an unknown email → the API's message, dialog still open. An
  account never granted: no AI button, no docked chat, no AI Agent section on the Test page.
- The API round trip is covered by e2e `addon-license.spec.ts`; a UI spec would need an admin
  sign-in through Permitteer, which the suite does not have — deliberately not added.

## Rollout

PR into `feat/permitteer-login` → Codex loop → merge → app.dev auto-builds and `next` mirrors. No
server, database or Amplify-env change: the API and rows are already live on every stage, so the
page works the day it lands, and prod gets it with the branch's promotion.

## Left for later

- **app.ai.remote.it for the unlicensed.** With no floor, an account without the add-on gets the
  ordinary portal there, chat-less and without a word about why (the popout is the one place that
  says so). If the AI portal should explain itself, that is a notice keyed on the same gate — not a
  bypass. The Amplify branch env's `VITE_CHAT_ALWAYS_ON=true` is now inert and can be removed.
- **The admin user-detail "License" column** (`pages/AdminUsersPage/adminUserAttributes.tsx`, a
  TODO) is the natural place to *show* an account's add-ons beside its plan.
- **Phase 2/3** (paid tiers carrying the limit; the add-on sold through Stripe) are API-side — see
  graphql-api `docs/AI-AGENT-LICENSE.md`. Nothing on this page changes for them: a Stripe-owned
  licence is refused by the API's `remove`, and the page just shows that message.
