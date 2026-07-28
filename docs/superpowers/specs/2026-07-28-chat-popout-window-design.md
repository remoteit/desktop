# Chat Panel Popout Window — Design

**Date:** 2026-07-28
**Repo:** `remoteit/desktop`
**Branch:** `feature/agent-chat-interface`

## Purpose

Let the user pop the AI chat panel out of the app into its own window (per
mockup: pop-out button in the docked chat header; standalone chat window
with a pop-in button), and bring it back with the conversation intact.

## Decisions (from brainstorming)

1. **Move semantics** — popping out hides the docked panel; the standalone
   window owns the conversation. Popping back in (button or window close)
   returns it, transcript intact. No live mirroring between windows.
2. **Environments: browser + Electron.** Mobile never shows the button.
   The whole feature remains behind the existing `MODE === 'development'`
   gate, matching the chat panel itself.
3. **Mechanism: boot flag + BroadcastChannel.** The popout loads the same
   app bundle with a `?chatPopout` boot flag; a BroadcastChannel performs
   the conversation hand-off. No second Vite entry; no reliance on
   redux-persist write ordering (both windows persist to the same
   localStorage key, so storage alone is racy).

## Architecture

### Boot flag and rendering

- The `chatPopout` query param is captured at module scope on boot (same
  pattern as the hydra `?code` capture in `services/hydra.ts`), so hash
  routing cannot clobber it.
- `App.tsx`: when the flag is set (and `MODE === 'development'`), render a
  bare `<ChatWindow />` in place of the app shell (sidebar/router). All
  pre-auth gates (loading, sign-in) behave as today; in practice the
  popout is already authenticated because Amplify and agent tokens live in
  shared localStorage.
- Component split: the chat internals (health notices, org select,
  messages, approval, input) are extracted from `ChatPanel` into a shared
  piece. `ChatPanel` (docked column) and `ChatWindow` (full-page popout)
  both render it:
  - `ChatPanel` header: expand, new chat, **pop out** (new), close.
  - `ChatWindow` header: new chat, **pop in**. The window's own chrome
    provides close. No expand button, no panel-close button.
  - `ChatWindow` ignores `chat.open` (it always shows).

### Popout service — `frontend/src/services/chatPopout.ts`

Owns `window.open`, the BroadcastChannel (`remoteit-chat-popout`), and the
hand-off protocol. Message types:

| Message | Direction | Payload | Effect |
|---|---|---|---|
| `hello` | popout → main | — | main replies `adopt`, then sets `open: false, poppedOut: true` |
| `adopt` | main → popout | `{ messages, conversationId, orgId }` | popout replaces its chat slice with the payload |
| `handback` | popout → main | `{ messages, conversationId, orgId }` | main applies payload, sets `poppedOut: false, open: true` |
| `ping` | main → popout | — | presence check on main boot |
| `alive` | popout → main | — | main keeps dock hidden (`poppedOut: true`) |
| `signout` | main → popout | — | popout closes itself WITHOUT sending `handback` (sign-out clears the transcript anyway) |

- `openChatPopout()`: `window.open(origin + '/?chatPopout', 'remoteit-chat',
  'popup,width=520,height=780')`.
- Popout boot: send `hello`; if no `adopt` arrives within 300 ms, fall
  back to the redux-persisted transcript (covers popout refresh / main
  gone). A late `adopt` after the fallback is still applied — main's copy
  is authoritative at hand-off.
- Pop-in or `beforeunload`: abort any active stream first (same path as
  the Stop button; the open message is marked interrupted), then send
  `handback`, then close.
- Crash resilience: while `poppedOut`, main polls `popoutWindow.closed`
  (~2s). Closed without a `handback` → restore `open: true` from the
  persisted transcript. Poll and `handback` are idempotent together.
- Main boot: `ping`; only an `alive` reply keeps `poppedOut: true`
  (corrects stale persisted state).
- App sign-out (`chat.signOut`): broadcast `signout` before clearing.

### Model — `frontend/src/models/chat.ts`

- `poppedOut: boolean` added to `IChatState` (default false; value is
  authoritative only after the boot ping settles).
- Effects for the protocol reactions (adopt/handback application) so all
  state changes stay in the model; the service holds no state of its own
  beyond the channel and window handle.

### Electron — `electron/src/ElectronApp.ts`

`setWindowOpenHandler` gains one branch: a URL on the app's own origin
carrying the `chatPopout` flag returns

```
{ action: 'allow', overrideBrowserWindowOptions:
  { width: 520, height: 780, minWidth: 360, minHeight: 500, autoHideMenuBar: true } }
```

All other URLs keep the existing deny + `shell.openExternal` behavior.
BroadcastChannel works across the two windows unchanged (same origin and
session partition).

## Edge handling

- **Main window closes/reloads while popped out** — popout keeps working
  (own store, shared tokens). Next main boot pings; `alive` keeps the dock
  hidden.
- **Mid-stream pop-in/close** — stream aborted, message marked
  interrupted, transcript preserved in the `handback`.
- **Popout opened twice** — the named window (`'remoteit-chat'`) is
  reused by `window.open`, so a second click focuses the existing popout.
- **Mobile / non-dev builds** — button absent (`MODE` gate + no button on
  mobile via `browser.isMobile`).

## Verification

Typecheck (`cd frontend && npm run typecheck`) plus a manual script:

1. Pop out → docked panel hides, window opens with transcript and org
   selection intact.
2. Converse in the popout (org scoping still applies), pop in → dock
   returns with the full transcript.
3. Close the popout with the window X → same as pop-in.
4. Kill the popout process / crash it → dock restores within ~2s.
5. Reload the main window while popped out → dock stays hidden; popout
   unaffected.
6. Sign out of the app → popout closes.
7. Electron dev build: pop out opens a native window with the specified
   size; external links still open in the system browser.
