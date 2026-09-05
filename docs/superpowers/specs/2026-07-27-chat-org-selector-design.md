# Chat Panel Organization Selector — Design

**Date:** 2026-07-27
**Repos:** `remoteit/desktop` (frontend), `remoteit/ai-agent` (backend)
**Branch:** `feature/agent-chat-interface`

## Purpose

Let the user pick which organization the AI agent chat is scoped to, and pass
that org to the ai-agent service so the agent no longer has to resolve org
context itself (via `whoami` + membership queries) before making org-scoped
GraphQL/MCP calls.

## Decisions (from brainstorming)

1. **Independent dropdown** in the chat panel, below the header. Defaults to
   the app's active org (`accounts.activeId`) but can diverge from it. Not
   persisted across reloads.
2. **Backend consumes the org via system prompt injection** — no MCP or tool
   layer changes; the agent stays free to query other orgs when explicitly
   asked.
3. **Switching org mid-conversation keeps the chat**; the new org simply
   applies from the next turn. No transcript divider, no reset.
4. **Personal account = omit**: when the selection is the user's personal
   account, the frontend omits the `org` field entirely. The agent's default
   behavior is already personal-account scope, so nothing needs to be said.

## Frontend (`remoteit/desktop`)

### State — `frontend/src/models/chat.ts`

- Add `orgId: string | null` to `IChatState` (default `null`).
- When the panel opens (existing `chat.open` effect path): if `orgId` is null
  or no longer matches the user's id or any membership, set it to
  `accounts.activeId`.
- `send()` resolves `orgId` to `{ id, name }`:
  - Name lookup via `state.organization.accounts[orgId]?.name`, membership via
    `state.accounts.membership` (same sources as `OrganizationSelect.tsx`).
  - If `orgId` equals the user's own id (personal account), pass `undefined`.
- Passes `org` to `streamChat` each turn (service is stateless).

### UI — new `frontend/src/components/Chat/ChatOrgSelect.tsx`

- Compact MUI `Select`, rendered in `ChatPanel.tsx` directly below the header
  row.
- Options: "Personal" first (value = user id), then org memberships sorted by
  name (skip memberships whose org data hasn't loaded, mirroring the
  `disabled: !org.id` guard in `OrganizationSelect.tsx`).
- Always enabled, including while streaming — a change only affects the next
  turn.
- `onChange` → `dispatch.chat.set({ orgId })`.

### Client — `frontend/src/services/agent.ts`

- `streamChat` options gain `org?: { id: string; name: string }`.
- Included in the `/api/chat` POST body alongside `conversationId` and
  `messages` when present.

## Backend (`remoteit/ai-agent`)

### `src/server.ts`

- `parseChatRequest` accepts optional `org`. Validation: if present it must be
  `{ id: string, name: string }` with non-empty strings — otherwise 400.

### `src/chatService.ts`

- `runChatTurn` gains an optional `org` parameter, threaded to the agent loop
  / prompt assembly.
- Audit log entries for the turn include the org id.

### System prompt

- When `org` is present, append a section to the system prompt:

  > ## Selected organization
  > The user has selected organization "<name>" (accountId `<id>`) in the
  > app. Use this accountId for org-scoped tools unless the user explicitly
  > asks about a different organization or their personal account.

- **Sanitization:** the org name is user-influenced data entering the system
  prompt. Strip newlines/control characters and cap length (~100 chars)
  before injection. The id is validated as a plausible id string (no
  whitespace/newlines).

## Error handling

- `org` is optional end-to-end; omitted → behavior identical to today.
- Malformed `org` → 400 from the server (matches existing body validation
  style).
- Frontend never blocks a send on org resolution. The dropdown only offers
  orgs whose data has loaded, so the name lookup should always succeed; if
  state is inconsistent anyway (name missing), the frontend omits the `org`
  field for that turn rather than sending a value the server would reject.

## Testing

- **ai-agent (vitest):**
  - `/api/chat` accepts a valid `org` and the assembled system prompt
    contains the org section.
  - Malformed `org` (wrong types, empty strings) → 400.
  - Omitted `org` → prompt unchanged from today.
  - Sanitization: newlines and over-long names are cleaned before injection.
- **desktop frontend:** `npm run typecheck`; manual verification in the dev
  panel (select org → agent call carries it; personal → field absent;
  mid-conversation switch applies next turn).
