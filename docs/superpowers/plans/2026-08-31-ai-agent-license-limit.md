# Server-side handling for the `ai-agent` license limit

**Goal:** Make the Remote.It AI chat a real licensed feature by having the API return an
`ai-agent` limit, then remove the client-side scaffolding that stands in for it today.

**Status:** The CLIENT side is done and shipped on `feature/agent-chat-interface`. The API
returns no such limit yet, so the client forward-declares it. Nothing here is blocked on
more frontend work — this note is for whoever picks up the graphql-api / licensing side.

**Where the work lives:** the limit itself is a graphql-api + licensing change, in another
repo. The only thing in THIS repo is the cleanup in the last section, which should land at
the same time.

---

## What the client already does

The whole chat surface hangs off one name, `CHAT_FEATURE = 'ai-agent'`
(`frontend/src/constants.ts`). `useChatEnabled` reads it through `selectLimitsLookup`, the
same selector that gates `tagging`, `saml` and `roles`:

```ts
export const useChatEnabled = (): boolean =>
  useSelector((state: State) => !!selectLimitsLookup(state)[CHAT_FEATURE])
```

Nothing chat-related mounts when it is false — no header button, no docked panel, and no
requests to the agent service. So the API turning this on is the entire switch; no release
is needed to enable the feature for an account.

Because the API does not send it yet, `constants.ts` forward-declares it:

```ts
export const PENDING_FEATURES: ILookup<boolean> = {
  [CHAT_FEATURE]: MODE === 'development' || CHAT_ALWAYS_ON,
}
```

That gives the flag a default (on in local dev and on app.ai.remote.it, off everywhere
else) and a row on the Test page. **The API's value wins the moment it starts arriving** —
`selectLimitsLookup` writes the pending defaults first and then overwrites from the API's
limits — so shipping the limit needs no coordinated client release.

## The contract the client expects

A **boolean** limit named `ai-agent`, delivered alongside the existing limits on both the
personal account and organizations. The client already asks for it — no query change is
needed. `frontend/src/services/graphQLRequest.ts` sends:

```graphql
limits { name value actual base scale license { id } }
```

on `login.limits`, `login.account.limits` and each organization's `limits`. Existing
booleans to model it on: `firewall`, `no-splash`, `roles`, `saml`, `tagging` (all
`value: true`, `scale: null`).

**It must be a boolean.** Two client behaviours depend on it:

- `selectFeatures` (`frontend/src/selectors/organizations.ts`) lists Test page rows with
  `typeof l.value === 'boolean'`, so a numeric limit would silently vanish from that page.
- `useChatEnabled` coerces with `!!`, so a numeric `0` reads as off but any non-zero number
  reads as on — a seat count would accidentally work, and confusingly.

If the feature genuinely needs a numeric dimension (seats, spend cap), raise it before
implementing — that is a client change, not just a server one.

## Decisions to make first

1. **Confirm the name.** `ai-agent` is the frontend's assumption, picked to match the
   existing kebab-case convention. If licensing wants something else, it is a one-constant
   change (`CHAT_FEATURE`) — but agree it before either side ships.

2. **Per-organization, per-user, or both?** The client reads the limits of the account
   currently selected in the sidebar, so as written the chat follows the ORGANIZATION you
   are viewing: an org whose license lacks the agent gets no chat, even for a user whose
   own account has it. That is consistent with every other paywalled feature, and it is
   deliberate — but confirm it is what licensing intends, because the agent service's own
   spend limits are per-USER, so the two are scoped differently.

3. **What happens to app.ai.remote.it.** This one bites the day the limit ships. That
   deployment sets `VITE_CHAT_ALWAYS_ON=true`, which today only sets the flag's *default*
   — so once the API returns `ai-agent: false` for an unlicensed account, the API value
   wins and that user gets an empty app on a site that exists solely to be the AI surface.
   Pick one before shipping:
   - make `CHAT_ALWAYS_ON` a floor that outranks the API value (one line in
     `selectLimitsLookup`), so the portal never paywalls itself; or
   - accept that the portal paywalls, and give it a real "you don't have this" screen.

4. **Which plans carry it,** and whether there is a trial/evaluation form (compare
   `aws-evaluation`, `trial-devices`).

## Client cleanup, to land with the server change

Once `ai-agent` is live everywhere, in this repo:

- Delete the `PENDING_FEATURES` entry in `frontend/src/constants.ts`. With the map empty,
  also delete `PENDING_FEATURES` itself and its two consumers in
  `frontend/src/selectors/organizations.ts` (`selectLimitsLookup`'s seeding loop, and the
  `pending` branch of `selectFeatures`), plus the `IFeature.pending` field and the
  `testPage.featurePending` string in all four locale catalogs.
- Delete `CHAT_ALWAYS_ON` and `VITE_CHAT_ALWAYS_ON` — unless decision 3 keeps it as a
  floor. It appears in `.env`, `frontend/.env`, `electron/.env`, `.env.example`, and the
  **Amplify branch environment** for the AI portal (console only, not in the repo — see
  the amplify-build-config note).
- Nothing else references the flag; `useChatEnabled` already reads only the license.

Verification in this repo: `npm run typecheck`, `cd frontend && npm run i18n:check`, and
`npx prettier --check` on changed files. There is no unit-test infrastructure in the
frontend, so behaviour changes are verified by driving the running app.

## Related, but not this task

On 2026-08-31 the AS retired the `remoteit_mcp_dev` authorization_details type for the
stage-stable `remoteit_mcp`, which broke dev sign-in for any build that pinned the old
name. Fixed in `d646b229`: the type is now discovered from the MCP resource's PRM at
sign-in, with the constant as an offline fallback. If dev sign-in still fails on a machine,
check that its `.env` does not set `VITE_OAUTH_MCP_DETAIL` to the retired name — an env
value overrides the fallback. A client-side redirect loop the retirement triggered was
fixed separately in `a0386f40`; a refused authorize is now reported once, not retried.
