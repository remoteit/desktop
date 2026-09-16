# Chat Popout Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pop the chat panel out into its own window (browser + Electron) with move semantics — the docked panel hides while popped out and the conversation hands back intact.

**Architecture:** The popout loads the same app bundle with a `?chatPopout` boot flag; `App.tsx` renders a bare `ChatWindow` instead of the app shell. A BroadcastChannel (`remoteit-chat-popout`) carries the hand-off protocol (hello/adopt/handback/ping/alive/signout) with dependency-injected handlers so the service never imports the store (no circular imports). Electron's `setWindowOpenHandler` gains an allow-branch for the app's own popout URL.

**Tech Stack:** React + rematch + MUI, BroadcastChannel API, Electron BrowserWindow options.

**Spec:** `docs/superpowers/specs/2026-07-28-chat-popout-window-design.md`

## Global Constraints

- Repo `/Users/larrygunteriv/github/remoteit/desktop`, branch `feature/agent-chat-interface`. NEVER commit to or push main.
- The repo has UNRELATED uncommitted changes (`.npmrc`, `frontend/package.json`, `frontend/src/components/Icon.tsx`) — never touch or stage them.
- Everything stays behind the existing `MODE === 'development'` gate; mobile (`browser.isMobile`) never shows the pop-out button.
- Move semantics: popping out hides the docked panel; hand-off payloads travel IN the BroadcastChannel messages, never via storage ordering (persistence is localForage/IndexedDB and both windows write the same key).
- Channel name `remoteit-chat-popout`; window name `remoteit-chat`; window features `popup=yes,width=520,height=780`; Electron override `{ width: 520, height: 780, minWidth: 360, minHeight: 500, autoHideMenuBar: true }`.
- Frontend verification is `cd frontend && npm run typecheck` (no unit-test infra). Electron verification is `cd electron && npm run typecheck`.
- Run `npx prettier --write <changed files>` (from `frontend/`) before each frontend commit.

---

### Task 1: Extract `ChatBody` from `ChatPanel`

**Files:**
- Create: `frontend/src/components/Chat/ChatBody.tsx`
- Modify: `frontend/src/components/Chat/ChatPanel.tsx`

**Interfaces:**
- Consumes: existing `ChatOrgSelect`, `ChatMessages`, `ChatApproval`, `ChatInput`, `Notice` components; `state.chat` slice.
- Produces: `export const ChatBody: React.FC` (no props) — the org select, health notices, message list w/ approval + error, and input. Tasks 2–3 render it from `ChatWindow` and `ChatPanel`.

- [ ] **Step 1: Create ChatBody**

Create `frontend/src/components/Chat/ChatBody.tsx` — this is a pure move of ChatPanel's content below the header (currently `ChatPanel.tsx:69-110`):

```tsx
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from '@mui/material'
import { State, Dispatch } from '../../store'
import { ChatMessages } from './ChatMessages'
import { ChatApproval } from './ChatApproval'
import { ChatInput } from './ChatInput'
import { ChatOrgSelect } from './ChatOrgSelect'
import { Notice } from '../Notice'

/* Everything below the chat header — shared by the docked panel and the
   popout window */
export const ChatBody: React.FC = () => {
  const chat = useSelector((state: State) => state.chat)
  const dispatch = useDispatch<Dispatch>()

  return (
    <>
      <ChatOrgSelect />
      {chat.health === 'unreachable' && (
        <Notice severity="warning" gutterTop>
          Agent unreachable — is the dev service running on :3001?
        </Notice>
      )}
      {chat.health === 'unauthorized' && (
        <Notice severity="warning" gutterTop>
          <>
            The AI agent needs its own sign-in to act on your behalf.
            <Button
              fullWidth
              size="small"
              variant="contained"
              onClick={() => dispatch.chat.signIn()}
              sx={{ marginTop: 1 }}
            >
              Sign in with remote.it
            </Button>
          </>
        </Notice>
      )}
      <ChatMessages messages={chat.messages} streaming={chat.streaming}>
        {chat.pendingConfirmation && (
          <ChatApproval
            toolName={chat.pendingConfirmation.toolName}
            input={chat.pendingConfirmation.input}
            onRespond={approved => dispatch.chat.confirm(approved)}
          />
        )}
        {chat.error && (
          <Notice severity="error" onClose={() => dispatch.chat.set({ error: null })}>
            {chat.error}
          </Notice>
        )}
      </ChatMessages>
      <ChatInput
        disabled={!!chat.pendingConfirmation}
        streaming={chat.streaming}
        onSend={text => dispatch.chat.send(text)}
        onStop={() => dispatch.chat.stop()}
      />
    </>
  )
}
```

- [ ] **Step 2: Use it in ChatPanel**

In `frontend/src/components/Chat/ChatPanel.tsx`, replace everything after the header `<Box>` (the `<ChatOrgSelect />`, both `Notice` blocks, `<ChatMessages>…</ChatMessages>`, and `<ChatInput …/>` — currently lines 69–110) with:

```tsx
      <ChatBody />
```

and update imports: add `import { ChatBody } from './ChatBody'`; remove the now-unused imports `Button` (keep `Box`, `Typography` from @mui/material), `ChatMessages`, `ChatApproval`, `ChatInput`, `ChatOrgSelect`, and `Notice`.

- [ ] **Step 3: Typecheck**

Run: `cd /Users/larrygunteriv/github/remoteit/desktop/frontend && npm run typecheck`
Expected: clean — this is a pure extraction.

- [ ] **Step 4: Commit**

```bash
cd /Users/larrygunteriv/github/remoteit/desktop/frontend && npx prettier --write src/components/Chat/ChatBody.tsx src/components/Chat/ChatPanel.tsx
cd /Users/larrygunteriv/github/remoteit/desktop
git add frontend/src/components/Chat/ChatBody.tsx frontend/src/components/Chat/ChatPanel.tsx
git commit -m "refactor(chat): extract ChatBody shared by panel and popout"
```

---

### Task 2: Boot flag, popout service skeleton, and `ChatWindow`

**Files:**
- Create: `frontend/src/services/chatPopout.ts`
- Create: `frontend/src/components/Chat/ChatWindow.tsx`
- Modify: `frontend/src/components/App.tsx`

**Interfaces:**
- Consumes: `ChatBody` from Task 1; `MODE` from `../constants`; `store` (components only, never the service).
- Produces (Task 3 relies on these exact names):
  - `chatPopout.ts`: `isChatPopout: boolean`, `CHAT_POPOUT_FLAG = 'chatPopout'`, `type ChatHandoff = { messages: ChatTranscriptMessage[]; conversationId: string; orgId: string | null }`.
  - `ChatWindow: React.FC` — full-page chat for the popout.

- [ ] **Step 1: Create the service with the boot flag**

Create `frontend/src/services/chatPopout.ts`:

```ts
// import type only: the chat model value-imports this service (signout
// broadcast), so a value import here would create a runtime cycle
import type { ChatTranscriptMessage } from '../models/chat'

/**
 * Chat popout: the panel moves into its own window (same bundle, boot flag)
 * and the conversation hands off over a BroadcastChannel. This module owns
 * the flag, the channel, and the protocol; it never imports the store —
 * callers inject handlers (avoids store/model import cycles).
 */
export const CHAT_POPOUT_FLAG = 'chatPopout'

// Captured at module-evaluation time, before any routing can touch the URL
// (same pattern as the hydra ?code capture in services/hydra.ts)
export const isChatPopout = new URLSearchParams(window.location.search).has(CHAT_POPOUT_FLAG)

export type ChatHandoff = {
  messages: ChatTranscriptMessage[]
  conversationId: string
  orgId: string | null
}
```

- [ ] **Step 2: Create ChatWindow**

Create `frontend/src/components/Chat/ChatWindow.tsx` (protocol wiring comes in Task 3 — this step renders a working standalone chat):

```tsx
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Box, Typography } from '@mui/material'
import { Dispatch } from '../../store'
import { IconButton } from '../../buttons/IconButton'
import { ChatBody } from './ChatBody'

/* Full-page chat for the popped-out window (?chatPopout boot flag). The
   window chrome provides close; pop-in wiring lands with the protocol. */
export const ChatWindow: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    document.title = 'remote.it chat'
    dispatch.chat.resetTransient()
    dispatch.chat.syncOrg()
    dispatch.chat.checkHealth()
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        flexFlow: 'column',
        height: '100%',
        width: '100%',
        bgcolor: 'white.main',
        paddingBottom: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', paddingX: 2, paddingY: 1 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1, padding: 0, margin: 0, minHeight: 0 }}>
          New Chat
        </Typography>
        <IconButton icon="plus" title="New Chat" onClick={() => dispatch.chat.clearConversation()} />
      </Box>
      <ChatBody />
    </Box>
  )
}
```

- [ ] **Step 3: Branch in App.tsx**

In `frontend/src/components/App.tsx`:

1. Add imports:

```tsx
import { ChatWindow } from './Chat/ChatWindow'
import { isChatPopout } from '../services/chatPopout'
```

2. Replace the final `return` block's PersistGate content (currently the layout `<Box>` + `{showBottomMenu && <BottomMenu …/>}`) so the popout renders only the chat:

```tsx
  return (
    <Page>
      <ViewAsBanner />
      <PersistGate persistor={persistor} loading={<LoadingMessage message="Restoring state..." />}>
        {MODE === 'development' && isChatPopout ? (
          <ChatWindow />
        ) : (
          <>
            <Box
              sx={{
                flexGrow: 1,
                position: 'relative',
                display: 'flex',
                overflow: 'hidden',
                flexDirection: 'row',
                alignItems: 'start',
                justifyContent: 'start',
              }}
            >
              {hideSidebar ? <SidebarMenu /> : <Sidebar layout={layout} />}
              <Router layout={layout} />
              {MODE === 'development' && <ChatPanel />}
            </Box>
            {showBottomMenu && <BottomMenu layout={layout} />}
          </>
        )}
      </PersistGate>
    </Page>
  )
```

All pre-auth gates above the final return stay untouched (sign-in still works in the popout if needed).

- [ ] **Step 4: Typecheck and verify render**

Run: `cd /Users/larrygunteriv/github/remoteit/desktop/frontend && npm run typecheck`
Expected: clean.

If the vite dev server is running, open `http://localhost:3003/?chatPopout` in a browser tab — the bare chat should render (transcript rehydrates from persistence), no sidebar/router.

- [ ] **Step 5: Commit**

```bash
cd /Users/larrygunteriv/github/remoteit/desktop/frontend && npx prettier --write src/services/chatPopout.ts src/components/Chat/ChatWindow.tsx src/components/App.tsx
cd /Users/larrygunteriv/github/remoteit/desktop
git add frontend/src/services/chatPopout.ts frontend/src/components/Chat/ChatWindow.tsx frontend/src/components/App.tsx
git commit -m "feat(chat): standalone chat window behind ?chatPopout boot flag"
```

---

### Task 3: Hand-off protocol, pop-out/pop-in buttons, crash resilience

**Files:**
- Modify: `frontend/src/services/chatPopout.ts`
- Modify: `frontend/src/models/chat.ts`
- Modify: `frontend/src/components/Chat/ChatPanel.tsx`
- Modify: `frontend/src/components/Chat/ChatWindow.tsx`

**Interfaces:**
- Consumes: Task 2's `ChatHandoff`, `CHAT_POPOUT_FLAG`, `isChatPopout`; chat model reducers `set`, `adoptTranscript` (new).
- Produces:
  - Service: `openChatPopout(): boolean`, `initChatPopoutMain(handlers: PopoutMainHandlers): void`, `checkPopoutPresence(handlers: PopoutMainHandlers): void`, `initChatPopoutWindow(handlers: PopoutWindowHandlers): void`, `popIn(payload: ChatHandoff): void`, `broadcastChatSignout(): void`.
  - Model: `IChatState.poppedOut: boolean`; reducer `adoptTranscript(state, payload: ChatHandoff)`.

- [ ] **Step 1: Model additions**

In `frontend/src/models/chat.ts`:

1. Add to `IChatState` (after `orgId`) and to `defaultChatState` (`poppedOut: false`):

```ts
  /** Conversation currently lives in the popout window (main window only) */
  poppedOut: boolean
```

2. Add the import at the top: `import { ChatHandoff, broadcastChatSignout } from '../services/chatPopout'`

3. Add reducer (next to `clearConversation`):

```ts
    /* Hand-off: replace the conversation with the other window's copy */
    adoptTranscript(state: IChatState, payload: ChatHandoff) {
      state.messages = payload.messages
      state.conversationId = payload.conversationId
      state.orgId = payload.orgId
      return state
    },
```

4. In the `signOut` effect, broadcast to the popout FIRST (it closes without a handback; sign-out clears the transcript anyway):

```ts
    async signOut() {
      broadcastChatSignout()
      abortController?.abort()
      abortController = null
      dispatch.chat.reset()
      await agentSignOut()
    },
```

Note: `services/chatPopout.ts` must not import the store or any model — the import direction is model → service only.

- [ ] **Step 2: Protocol implementation in the service**

Append to `frontend/src/services/chatPopout.ts`:

```ts
type PopoutMessage =
  | { type: 'hello' }
  | { type: 'adopt'; payload: ChatHandoff }
  | { type: 'handback'; payload: ChatHandoff }
  | { type: 'ping' }
  | { type: 'alive' }
  | { type: 'signout' }

export type PopoutMainHandlers = {
  getHandoff: () => ChatHandoff
  /** handback arrived: apply the transcript and reopen the dock */
  adopt: (payload: ChatHandoff) => void
  /** popout said hello: hide the dock */
  onPopoutOpened: () => void
  /** popout vanished without a handback: reopen the dock as-is */
  onPopoutLost: () => void
  /** boot reconciliation: does a popout exist right now? */
  onPresence: (present: boolean) => void
}

export type PopoutWindowHandlers = {
  adopt: (payload: ChatHandoff) => void
  getHandoff: () => ChatHandoff
  onSignout: () => void
}

const CHANNEL = 'remoteit-chat-popout'
const WINDOW_NAME = 'remoteit-chat'
const WINDOW_FEATURES = 'popup=yes,width=520,height=780'
const POLL_INTERVAL = 2000
const PRESENCE_TIMEOUT = 500

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null
const post = (message: PopoutMessage) => channel?.postMessage(message)

let popoutWindow: Window | null = null
let pollTimer: number | undefined
let alivePending = false
let suppressHandback = false

/* ---------- main-window side ---------- */

export function openChatPopout(): boolean {
  const opened = window.open(`${window.location.origin}/?${CHAT_POPOUT_FLAG}`, WINDOW_NAME, WINDOW_FEATURES)
  if (!opened) return false // popup blocked — dock stays; hello never arrives
  popoutWindow = opened
  return true
}

export function initChatPopoutMain(handlers: PopoutMainHandlers): void {
  if (!channel) return
  channel.addEventListener('message', (event: MessageEvent<PopoutMessage>) => {
    switch (event.data.type) {
      case 'hello':
        post({ type: 'adopt', payload: handlers.getHandoff() })
        handlers.onPopoutOpened()
        startPolling(handlers)
        break
      case 'handback':
        stopPolling()
        handlers.adopt(event.data.payload)
        break
      case 'alive':
        alivePending = false
        break
    }
  })
}

/* Ask whether a popout survives from a previous page load; corrects a stale
   persisted poppedOut flag either way */
export function checkPopoutPresence(handlers: PopoutMainHandlers): void {
  if (!channel) {
    handlers.onPresence(false)
    return
  }
  alivePending = true
  post({ type: 'ping' })
  window.setTimeout(() => {
    if (alivePending) {
      handlers.onPresence(false)
    } else {
      handlers.onPresence(true)
      startPolling(handlers)
    }
  }, PRESENCE_TIMEOUT)
}

export function broadcastChatSignout(): void {
  post({ type: 'signout' })
}

/* Crash net: a popout that dies without beforeunload still restores the
   dock. Uses the window handle when we have one (same page load), pings
   otherwise (main was reloaded while popped out). */
function startPolling(handlers: PopoutMainHandlers) {
  if (pollTimer) return
  pollTimer = window.setInterval(() => {
    if (popoutWindow) {
      if (popoutWindow.closed) lost(handlers)
      return
    }
    alivePending = true
    post({ type: 'ping' })
    window.setTimeout(() => {
      if (alivePending && pollTimer) lost(handlers)
    }, PRESENCE_TIMEOUT)
  }, POLL_INTERVAL)
}

function stopPolling() {
  if (pollTimer) window.clearInterval(pollTimer)
  pollTimer = undefined
  popoutWindow = null
}

function lost(handlers: PopoutMainHandlers) {
  stopPolling()
  handlers.onPopoutLost()
}

/* ---------- popout-window side ---------- */

export function initChatPopoutWindow(handlers: PopoutWindowHandlers): void {
  if (!channel) return
  channel.addEventListener('message', (event: MessageEvent<PopoutMessage>) => {
    switch (event.data.type) {
      case 'adopt':
        // Main's copy is authoritative at hand-off; until it arrives the
        // window shows its own rehydrated (persisted) transcript
        handlers.adopt(event.data.payload)
        break
      case 'ping':
        post({ type: 'alive' })
        break
      case 'signout':
        suppressHandback = true // sign-out clears the transcript; nothing to hand back
        handlers.onSignout()
        break
    }
  })
  window.addEventListener('beforeunload', () => {
    if (!suppressHandback) post({ type: 'handback', payload: handlers.getHandoff() })
  })
  post({ type: 'hello' })
}

export function popIn(payload: ChatHandoff): void {
  post({ type: 'handback', payload })
  suppressHandback = true // beforeunload would duplicate it (harmless but noisy)
  window.close()
}
```

- [ ] **Step 3: Wire the main window (ChatPanel)**

In `frontend/src/components/Chat/ChatPanel.tsx`:

1. Imports: add `browser` service, popout service, and store:

```tsx
import browser from '../../services/browser'
import { store, State, Dispatch } from '../../store'
import { openChatPopout, initChatPopoutMain, checkPopoutPresence, PopoutMainHandlers, ChatHandoff } from '../../services/chatPopout'
```

2. Above the component, the handoff snapshot helper:

```tsx
const currentHandoff = (): ChatHandoff => {
  const c = store.getState().chat
  return { messages: c.messages, conversationId: c.conversationId, orgId: c.orgId }
}
```

3. Inside the component, replace the existing mount effect (the one calling `handleSignInCallback`) with one that also wires the protocol:

```tsx
  // Completes a Hydra sign-in redirect if this page load carries ?code —
  // runs on mount regardless of whether the panel is open
  useEffect(() => {
    dispatch.chat.handleSignInCallback()
    const handlers: PopoutMainHandlers = {
      getHandoff: currentHandoff,
      adopt: payload => {
        dispatch.chat.adoptTranscript(payload)
        dispatch.chat.set({ poppedOut: false, open: true })
      },
      onPopoutOpened: () => dispatch.chat.set({ open: false, poppedOut: true }),
      onPopoutLost: () => dispatch.chat.set({ poppedOut: false, open: true }),
      onPresence: present => dispatch.chat.set(present ? { poppedOut: true, open: false } : { poppedOut: false }),
    }
    initChatPopoutMain(handlers)
    checkPopoutPresence(handlers)
  }, [])
```

4. Add the pop-out button to the header, before the New Chat button (browser/Electron only — never mobile):

```tsx
        {!browser.isMobile && (
          <IconButton icon="arrow-up-right-from-square" title="Pop out" onClick={() => openChatPopout()} />
        )}
```

The dock hides when the popout's `hello` arrives — a blocked popup therefore changes nothing.

- [ ] **Step 4: Wire the popout window (ChatWindow)**

In `frontend/src/components/Chat/ChatWindow.tsx`:

1. Imports: add `import { store } from '../../store'` (extend the existing store import) and `import { initChatPopoutWindow, popIn, ChatHandoff } from '../../services/chatPopout'`.

2. Above the component:

```tsx
const currentHandoff = (): ChatHandoff => {
  const c = store.getState().chat
  return { messages: c.messages, conversationId: c.conversationId, orgId: c.orgId }
}
```

3. In the mount effect, after `checkHealth()`:

```tsx
    initChatPopoutWindow({
      adopt: payload => dispatch.chat.adoptTranscript(payload),
      getHandoff: currentHandoff,
      onSignout: () => window.close(),
    })
```

4. Add the pop-in button after the New Chat button (stop any stream first — the open message is marked interrupted by the existing stop path):

```tsx
        <IconButton
          icon="down-left-and-up-right-to-center"
          title="Pop back in"
          onClick={async () => {
            await dispatch.chat.stop()
            popIn(currentHandoff())
          }}
        />
```

- [ ] **Step 5: Typecheck**

Run: `cd /Users/larrygunteriv/github/remoteit/desktop/frontend && npm run typecheck`
Expected: clean.

- [ ] **Step 6: Manual verification (browser)**

With vite (`:3003`) and the ai-agent service (`:3001`) running, signed in, chat open with some transcript:

1. Click **Pop out** → window opens with the transcript and org selection; docked panel hides.
2. Send a message in the popout (org scoping still applies), click **Pop back in** → window closes, dock returns with the full conversation.
3. Pop out again, close the popout with the window's X → dock returns with the conversation.
4. Pop out, then reload the MAIN window → dock stays hidden (presence ping); popout unaffected.
5. Kill the popout without unload (e.g. from a task manager, or fake it: DevTools on the popout → `window.stop()` won't do it — acceptable to skip if awkward; the `window.closed` poll path is exercised by step 3 when beforeunload is raced).
6. Sign out of the app in the main window → popout closes.

Record what you verified in your report; note any step you could not perform.

- [ ] **Step 7: Commit**

```bash
cd /Users/larrygunteriv/github/remoteit/desktop/frontend && npx prettier --write src/services/chatPopout.ts src/models/chat.ts src/components/Chat/ChatPanel.tsx src/components/Chat/ChatWindow.tsx
cd /Users/larrygunteriv/github/remoteit/desktop
git add frontend/src/services/chatPopout.ts frontend/src/models/chat.ts frontend/src/components/Chat/ChatPanel.tsx frontend/src/components/Chat/ChatWindow.tsx
git commit -m "feat(chat): pop the chat out to its own window with transcript hand-off"
```

---

### Task 4: Electron window-open allow-branch

**Files:**
- Modify: `electron/src/ElectronApp.ts:248-252` (the `setWindowOpenHandler` block)

**Interfaces:**
- Consumes: the popout URL shape from Task 2 (`<origin>/?chatPopout`); `this.getStartUrl()` (`ElectronApp.ts:339`).
- Produces: popout opens as a native BrowserWindow in Electron; all other URLs keep opening externally.

- [ ] **Step 1: Implement the branch**

Replace the current handler (`ElectronApp.ts:248-252`):

```ts
    this.window.webContents.setWindowOpenHandler(({ url }) => {
      // The dev chat panel pops out into its own window (?chatPopout on our
      // own origin); every other window.open goes to the system browser.
      try {
        const parsed = new URL(url)
        if (parsed.origin === new URL(this.getStartUrl()).origin && parsed.searchParams.has('chatPopout')) {
          return {
            action: 'allow',
            overrideBrowserWindowOptions: {
              width: 520,
              height: 780,
              minWidth: 360,
              minHeight: 500,
              autoHideMenuBar: true,
            },
          }
        }
      } catch {}
      Logger.info('OPEN EXTERNAL URL', { url })
      electron.shell.openExternal(url)
      return { action: 'deny' }
    })
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/larrygunteriv/github/remoteit/desktop/electron && npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/larrygunteriv/github/remoteit/desktop
git add electron/src/ElectronApp.ts
git commit -m "feat(electron): open the chat popout as a native window"
```
