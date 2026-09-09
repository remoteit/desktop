# Chat Panel Org Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An org dropdown in the AI chat panel whose selection rides on every `/api/chat` request so the ai-agent scopes org queries without hunting for org context.

**Architecture:** Frontend (rematch model + MUI Select in `remoteit/desktop`) sends an optional `org: { id, name }` in the chat body each turn; the ai-agent service validates it, threads it through `runChatTurn` → `runAgentLoop`, and injects a sanitized "Selected organization" section into the system prompt after the cache breakpoint. Personal account = field omitted (today's default behavior).

**Tech Stack:** React + rematch + MUI (desktop frontend), Express + vitest (ai-agent, TypeScript ESM — note `.js` import suffixes).

**Spec:** `docs/superpowers/specs/2026-07-27-chat-org-selector-design.md`

## Global Constraints

- Two repos: `/Users/larrygunteriv/github/remoteit/desktop` (branch `feature/agent-chat-interface`) and `/Users/larrygunteriv/github/remoteit/ai-agent` (create branch `feature/chat-org-scope` off current HEAD, which is `feat/docker-containerization`). NEVER commit to or push `main` in either repo.
- `org` is optional end-to-end; omitted → behavior byte-identical to today.
- Org name is user-influenced data entering the system prompt: strip control chars, collapse whitespace, cap at 100 chars. Org id must match `/^[A-Za-z0-9-]{1,64}$/`.
- The org system block goes AFTER the prompt-cache breakpoint (it changes when the user switches orgs; it must not invalidate the cached prefix).
- ai-agent uses ESM imports with `.js` suffixes (`import ... from "./systemPrompt.js"`); tests run with `npx vitest run <file>`.
- Desktop frontend has no unit-test infra; its verification is `npm run typecheck` (run in `frontend/`) plus the manual check in Task 6.

---

### Task 1: `orgSystemSection` helper (ai-agent)

**Files:**
- Modify: `src/systemPrompt.ts` (append after the `SYSTEM_PROMPT` export)
- Test: `test/systemPrompt.org.test.ts` (new)

**Interfaces:**
- Produces: `export type OrgSelection = { id: string; name: string }` and `export function orgSystemSection(org: OrgSelection): string | null` — `null` means "omit the section". Tasks 2–3 import both from `./systemPrompt.js`.

- [ ] **Step 1: Create the ai-agent feature branch**

```bash
cd /Users/larrygunteriv/github/remoteit/ai-agent
git status --short   # confirm no unrelated staged changes; leave any untracked files alone
git checkout -b feature/chat-org-scope
```

- [ ] **Step 2: Write the failing test**

Create `test/systemPrompt.org.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { orgSystemSection } from "../src/systemPrompt.js";

describe("orgSystemSection", () => {
  it("renders the section with name and accountId", () => {
    const s = orgSystemSection({ id: "org-123-abc", name: "Acme Inc" });
    expect(s).toContain("## Selected organization");
    expect(s).toContain('organization "Acme Inc"');
    expect(s).toContain("accountId `org-123-abc`");
    expect(s).toContain("unless the user explicitly asks");
  });

  it("strips control characters and collapses whitespace in the name", () => {
    const s = orgSystemSection({ id: "org-1", name: "Acme\nInc\t\u0000  Corp" });
    expect(s).toContain('organization "Acme Inc Corp"');
    expect(s).not.toContain("Acme\nInc");
  });

  it("caps the name at 100 characters", () => {
    const s = orgSystemSection({ id: "org-1", name: "x".repeat(500) });
    expect(s).toContain(`"${"x".repeat(100)}"`);
    expect(s).not.toContain("x".repeat(101));
  });

  it("returns null for an id that fails the allowlist", () => {
    expect(orgSystemSection({ id: "bad id\nwith spaces", name: "Acme" })).toBeNull();
    expect(orgSystemSection({ id: "", name: "Acme" })).toBeNull();
    expect(orgSystemSection({ id: "x".repeat(65), name: "Acme" })).toBeNull();
  });

  it("returns null when the name is empty after sanitization", () => {
    expect(orgSystemSection({ id: "org-1", name: "\u0000\u0001 \n " })).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run test/systemPrompt.org.test.ts`
Expected: FAIL — `orgSystemSection` is not exported.

- [ ] **Step 4: Implement**

Append to `src/systemPrompt.ts`:

```typescript
export type OrgSelection = { id: string; name: string };

/**
 * System section for the org the user selected in the app. The name is
 * user-influenced data entering the system prompt, so it is sanitized;
 * returns null (omit the section) if either value doesn't survive.
 */
export function orgSystemSection(org: OrgSelection): string | null {
  const id = org.id.trim();
  if (!/^[A-Za-z0-9-]{1,64}$/.test(id)) return null;
  const name = org.name
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  if (!name) return null;
  return `## Selected organization\n\nThe user has selected organization "${name}" (accountId \`${id}\`) in the app. Use this accountId for org-scoped tools unless the user explicitly asks about a different organization or their personal account.`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run test/systemPrompt.org.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/systemPrompt.ts test/systemPrompt.org.test.ts
git commit -m "feat(org): sanitized system-prompt section for the selected org"
```

---

### Task 2: Org block in the agent loop's system prompt (ai-agent)

**Files:**
- Modify: `src/agentLoop.ts` (deps interface ~line 87–107, system assembly ~line 149–158)
- Test: `test/agentLoop.org.test.ts` (new)

**Interfaces:**
- Consumes: `orgSystemSection`, `OrgSelection` from Task 1.
- Produces: `AgentLoopDeps` gains `org?: OrgSelection`. Task 3 sets it from `runChatTurn`.

- [ ] **Step 1: Write the failing test**

Create `test/agentLoop.org.test.ts` (fake-anthropic pattern copied from `test/agentLoop.wait.test.ts`, extended to capture the stream params):

```typescript
import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { runAgentLoop } from "../src/agentLoop.js";
import type { AuditLogger } from "../src/auditLog.js";
import type { McpConnection } from "../src/mcp/types.js";

type SystemBlock = { type: string; text: string; cache_control?: { type: string } };

/** Fake anthropic that records each stream() call's params and ends the turn. */
function capturingAnthropic(captured: Array<{ system: SystemBlock[] }>): Anthropic {
  return {
    messages: {
      stream: (params: { system: SystemBlock[] }) => {
        captured.push(params);
        return { on: () => {}, finalMessage: async () => ({ stop_reason: "end_turn", content: [] }) };
      },
    },
  } as unknown as Anthropic;
}

const idleMcp: McpConnection = {
  listTools: async () => [],
  callTool: async () => ({ text: "{}", isError: false }),
  close: async () => {},
};

const audit = { log: () => {} } as unknown as AuditLogger;

function baseDeps(captured: Array<{ system: SystemBlock[] }>) {
  return {
    anthropic: capturingAnthropic(captured),
    mcp: idleMcp,
    audit,
    emit: () => {},
    classify: () => "read" as const,
    waitForConfirmation: async () => true,
  };
}

const turn = [{ role: "user" as const, content: "list my devices" }];

describe("org scope in the system prompt", () => {
  it("appends the org section after the cache breakpoint", async () => {
    const captured: Array<{ system: SystemBlock[] }> = [];
    await runAgentLoop(
      { ...baseDeps(captured), org: { id: "org-123", name: "Acme Inc" } },
      "conv-org",
      turn,
    );
    const system = captured[0].system;
    const last = system[system.length - 1];
    expect(last.text).toContain("accountId `org-123`");
    expect(last.cache_control).toBeUndefined();
    expect(system[system.length - 2].cache_control).toEqual({ type: "ephemeral" });
  });

  it("without org, the last system block carries the cache breakpoint", async () => {
    const captured: Array<{ system: SystemBlock[] }> = [];
    await runAgentLoop(baseDeps(captured), "conv-no-org", turn);
    const system = captured[0].system;
    expect(system[system.length - 1].cache_control).toEqual({ type: "ephemeral" });
    expect(system.some((b) => b.text.includes("## Selected organization"))).toBe(false);
  });

  it("drops an org that fails sanitization instead of injecting it", async () => {
    const captured: Array<{ system: SystemBlock[] }> = [];
    await runAgentLoop(
      { ...baseDeps(captured), org: { id: "bad id", name: "Acme" } },
      "conv-bad-org",
      turn,
    );
    const system = captured[0].system;
    expect(system.some((b) => b.text.includes("## Selected organization"))).toBe(false);
    expect(system[system.length - 1].cache_control).toEqual({ type: "ephemeral" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/agentLoop.org.test.ts`
Expected: FAIL — TypeScript rejects the unknown `org` dep / the first assertion finds no org text.

- [ ] **Step 3: Implement**

In `src/agentLoop.ts`:

1. Add to the imports from `./systemPrompt.js`: `orgSystemSection` and `type OrgSelection` (the file already imports `SYSTEM_PROMPT` from there).
2. Add to `AgentLoopDeps` (after `extraSystem`):

```typescript
  /** Org the user selected in the app; injected as a system section. */
  org?: OrgSelection;
```

3. Replace the system-assembly block (currently ends with `system[system.length - 1].cache_control = { type: "ephemeral" };`) with:

```typescript
  const system: TextBlockParam[] = [{ type: "text", text: SYSTEM_PROMPT }];
  if (deps.extraSystem) {
    system.push({
      type: "text",
      text: `## remote.it query cookbook (published by the MCP server)\n\n${deps.extraSystem}`,
    });
  }
  system[system.length - 1].cache_control = { type: "ephemeral" };
  // The org block rides after the cache breakpoint: it is tiny and changes
  // when the user switches orgs, so it must not invalidate the cached prefix.
  const orgSection = deps.org && orgSystemSection(deps.org);
  if (orgSection) system.push({ type: "text", text: orgSection });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/agentLoop.org.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run && npm run typecheck`
Expected: all existing tests still PASS; tsc clean.

- [ ] **Step 6: Commit**

```bash
git add src/agentLoop.ts test/agentLoop.org.test.ts
git commit -m "feat(org): inject selected-org section into the agent system prompt"
```

---

### Task 3: Wire protocol — request validation and threading (ai-agent)

**Files:**
- Modify: `src/server.ts` (`parseChatRequest` ~line 24–33, `/api/chat` route ~line 136)
- Modify: `src/chatService.ts` (`runChatTurn` signature ~line 48, `runAgentLoop` deps ~line 83–99)
- Test: `test/server.org.test.ts` (new)

**Interfaces:**
- Consumes: `OrgSelection` from Task 1, `AgentLoopDeps.org` from Task 2.
- Produces:
  - `parseChatRequest` is now exported; returns `{ conversationId: string; messages: MessageParam[]; org?: OrgSelection } | { error: string }`.
  - `runChatTurn(services, ctx, conversationId, messages, emit, signal?, org?)` — new trailing optional `org?: OrgSelection`. The GraphQL transport (`src/graphql/schema.ts`) is deliberately NOT changed; it simply never passes `org`.
  - Task 4's request body: `{ conversationId, messages, org? }`.

- [ ] **Step 1: Write the failing test**

Create `test/server.org.test.ts` (boot helper copied from `test/server.auth.test.ts`; env mode so no bearer is needed — malformed bodies are rejected before any turn machinery runs):

```typescript
import { afterAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type http from "node:http";
import { createServer, parseChatRequest } from "../src/server.js";
import type { ChatServices } from "../src/chatService.js";

function makeServices(): ChatServices {
  return {
    config: { toolClassificationOverrides: {} } as ChatServices["config"],
    anthropic: {} as ChatServices["anthropic"],
    audit: { log: () => {}, withUser: () => ({ log: () => {} }) } as unknown as ChatServices["audit"],
    tokenProvider: { getMcpAuth: async () => ({ token: "t", sub: "s", email: "e" }) } as unknown as ChatServices["tokenProvider"],
    connectMcp: async () => ({
      listTools: async () => [],
      callTool: async () => ({ text: "", isError: false }),
      close: async () => {},
    }),
  };
}

const servers: http.Server[] = [];

async function boot(): Promise<string> {
  const { httpServer } = createServer(makeServices(), { mode: "env" });
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  servers.push(httpServer);
  const { port } = httpServer.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

afterAll(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
});

const validTurn = { conversationId: "c1", messages: [{ role: "user", content: "hi" }] };

describe("POST /api/chat org validation", () => {
  it.each([
    ["non-object org", { ...validTurn, org: "acme" }],
    ["missing name", { ...validTurn, org: { id: "org-1" } }],
    ["empty id", { ...validTurn, org: { id: "", name: "Acme" } }],
    ["whitespace name", { ...validTurn, org: { id: "org-1", name: "   " } }],
    ["non-string id", { ...validTurn, org: { id: 42, name: "Acme" } }],
  ])("400s on %s", async (_label, body) => {
    const base = await boot();
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(400);
  });
});

describe("parseChatRequest org passthrough", () => {
  it("accepts a valid org", () => {
    const parsed = parseChatRequest({ ...validTurn, org: { id: "org-1", name: "Acme" } });
    expect(parsed).toMatchObject({ conversationId: "c1", org: { id: "org-1", name: "Acme" } });
  });

  it("accepts an omitted org", () => {
    const parsed = parseChatRequest(validTurn);
    expect("error" in parsed).toBe(false);
    expect((parsed as { org?: unknown }).org).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/server.org.test.ts`
Expected: FAIL — `parseChatRequest` is not exported; malformed-org bodies currently return 200 (SSE), not 400.

- [ ] **Step 3: Implement**

In `src/server.ts`:

1. Import the type: `import type { OrgSelection } from "./systemPrompt.js";`
2. Replace `parseChatRequest` with (note the added `export`):

```typescript
/** Validate the /api/chat body, returning a typed turn or an error message. */
export function parseChatRequest(
  body: unknown,
): { conversationId: string; messages: MessageParam[]; org?: OrgSelection } | { error: string } {
  const b = body as { conversationId?: unknown; messages?: unknown; org?: unknown };
  if (typeof b.conversationId !== "string" || !Array.isArray(b.messages) || b.messages.length === 0) {
    return { error: "Body must be { conversationId: string, messages: MessageParam[] }" };
  }
  let org: OrgSelection | undefined;
  if (b.org !== undefined) {
    const o = b.org as { id?: unknown; name?: unknown };
    if (
      typeof b.org !== "object" ||
      b.org === null ||
      typeof o.id !== "string" ||
      !o.id.trim() ||
      typeof o.name !== "string" ||
      !o.name.trim()
    ) {
      return { error: "org must be { id: string, name: string } with non-empty values" };
    }
    org = { id: o.id, name: o.name };
  }
  return { conversationId: b.conversationId, messages: b.messages as MessageParam[], org };
}
```

3. Pass it through in the `/api/chat` route:

```typescript
    await runChatTurn(services, restContext(req), parsed.conversationId, parsed.messages, emit, controller.signal, parsed.org);
```

In `src/chatService.ts`:

1. Import the type: `import type { OrgSelection } from "./systemPrompt.js";`
2. Add the trailing parameter to `runChatTurn`:

```typescript
export async function runChatTurn(
  services: ChatServices,
  ctx: TokenRequestContext,
  conversationId: string,
  messages: MessageParam[],
  emit: AgentEmitter,
  signal?: AbortSignal,
  org?: OrgSelection,
): Promise<void> {
```

3. Inside the tools branch, after `const turnAudit = audit.withUser({ sub, email });`, add the audit entry:

```typescript
    if (org) turnAudit.log({ event: "org_scope", conversationId, detail: org.id });
```

4. Add `org` to the `runAgentLoop` deps object (next to `extraSystem`):

```typescript
        extraSystem: cookbook ?? undefined,
        org,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/server.org.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npx vitest run && npm run typecheck`
Expected: all PASS; tsc clean (the unchanged GraphQL call site is fine — `org` is optional).

- [ ] **Step 6: Commit**

```bash
git add src/server.ts src/chatService.ts test/server.org.test.ts
git commit -m "feat(org): accept and thread the selected org through /api/chat"
```

---

### Task 4: Frontend client — send `org` on the wire (desktop)

**Files:**
- Modify: `frontend/src/services/agent.ts` (types ~line 58–67, `streamChat` ~line 69–81)

**Interfaces:**
- Consumes: the Task 3 body shape `{ conversationId, messages, org? }`.
- Produces: `export type OrgSelection = { id: string; name: string }` and `streamChat` options gain `org?: OrgSelection`. Task 5 imports `OrgSelection` from `../services/agent`.

- [ ] **Step 1: Implement**

In `frontend/src/services/agent.ts`, add the type next to `AgentMessageParam`:

```typescript
export type OrgSelection = { id: string; name: string }
```

Extend `streamChat`'s options and body (only the changed lines shown):

```typescript
export async function streamChat(options: {
  conversationId: string
  messages: AgentMessageParam[]
  org?: OrgSelection
  signal?: AbortSignal
  onEvent: (event: AgentEvent) => void
}): Promise<void> {
  const { conversationId, messages, org, signal, onEvent } = options
  const response = await fetch(`${AGENT_URL}/api/chat`, {
    method: 'POST',
    headers: agentHeaders(),
    body: JSON.stringify(org ? { conversationId, messages, org } : { conversationId, messages }),
    signal,
  })
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/larrygunteriv/github/remoteit/desktop/frontend && npm run typecheck`
Expected: clean (no errors introduced; callers pass `org` as optional).

- [ ] **Step 3: Commit**

```bash
cd /Users/larrygunteriv/github/remoteit/desktop
git add frontend/src/services/agent.ts
git commit -m "feat(chat): optional org field on the agent chat request"
```

---

### Task 5: Chat model — org state, defaulting, and send integration (desktop)

**Files:**
- Modify: `frontend/src/models/chat.ts` (state ~line 27–47, `send` effect ~line 110–134, new `syncOrg` effect)

**Interfaces:**
- Consumes: `OrgSelection` from Task 4; app state `state.user.id`, `state.accounts.activeId`, `state.accounts.membership` (items have `account.id`), `state.organization.accounts` (lookup by account id, has `.name`) — the same sources `frontend/src/components/OrganizationSelect.tsx` uses.
- Produces: `IChatState.orgId: string | null`; effect `dispatch.chat.syncOrg()` (Task 6 calls it when the panel opens); `dispatch.chat.set({ orgId })` (Task 6's dropdown calls it).

- [ ] **Step 1: Implement state**

In `frontend/src/models/chat.ts`:

1. Add `OrgSelection` to the imports from `'../services/agent'`.
2. Add to `IChatState` (after `conversationId`):

```typescript
  /** Org the agent is scoped to; null = uninitialized, user id = personal */
  orgId: string | null
```

3. Add to `defaultChatState`: `orgId: null,`

- [ ] **Step 2: Implement `syncOrg`**

Add to `effects` (after `send`). Runs when the panel opens: adopt the app's active org unless the current selection is still valid, so the chat org defaults to what the user is looking at but can diverge afterward:

```typescript
    /* Default the chat org to the app's active org when unset or no longer valid */
    async syncOrg(_: void, state) {
      const userId = state.user.id
      const validIds = new Set([userId, ...state.accounts.membership.map(m => m.account.id)])
      if (!state.chat.orgId || !validIds.has(state.chat.orgId)) {
        dispatch.chat.set({ orgId: state.accounts.activeId || userId })
      }
    },
```

- [ ] **Step 3: Implement send integration**

In the `send` effect, before the `streamChat` call, resolve the selection (personal account → `undefined`, per spec decision 4; a selection whose org data is missing → `undefined` rather than a value the server would 400 on):

```typescript
      const orgId = state.chat.orgId
      let org: OrgSelection | undefined
      if (orgId && orgId !== state.user.id) {
        const name = state.organization.accounts[orgId]?.name
        const isMember = state.accounts.membership.some(m => m.account.id === orgId)
        if (name && isMember) org = { id: orgId, name }
      }
```

and pass it through:

```typescript
        await streamChat({
          conversationId,
          messages,
          org,
          signal: abortController.signal,
          onEvent: event => dispatch.chat.applyEvent(event),
        })
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/larrygunteriv/github/remoteit/desktop/frontend && npm run typecheck`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
cd /Users/larrygunteriv/github/remoteit/desktop
git add frontend/src/models/chat.ts
git commit -m "feat(chat): org selection state scoped to the chat panel"
```

---

### Task 6: Dropdown UI + panel wiring + manual verification (desktop)

**Files:**
- Create: `frontend/src/components/Chat/ChatOrgSelect.tsx`
- Modify: `frontend/src/components/Chat/ChatPanel.tsx` (open effect ~line 23–28, header ~line 53–66)

**Interfaces:**
- Consumes: `state.chat.orgId`, `dispatch.chat.set({ orgId })`, `dispatch.chat.syncOrg()` from Task 5; membership/org-name state as in Task 5.
- Produces: `<ChatOrgSelect />`, rendered directly below the chat header.

- [ ] **Step 1: Create the component**

Create `frontend/src/components/Chat/ChatOrgSelect.tsx`. Mirrors `OrganizationSelect.tsx`'s data sourcing: memberships joined to `organization.accounts` for names, orgs whose data hasn't loaded are skipped, sorted by name; hidden entirely when the user has no orgs.

```tsx
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Box, TextField, MenuItem } from '@mui/material'
import { State, Dispatch } from '../../store'

/* Org the agent is scoped to — defaults to the app's active org (models/chat
   syncOrg) but diverges freely; a change applies from the next turn */
export const ChatOrgSelect: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const orgId = useSelector((state: State) => state.chat.orgId)
  const userId = useSelector((state: State) => state.user.id)
  const memberships = useSelector((state: State) => state.accounts.membership)
  const organizations = useSelector((state: State) => state.organization.accounts)

  const options = memberships
    .map(m => ({ id: m.account.id, name: organizations[m.account.id]?.name || '' }))
    .filter(o => o.name)
    .sort((a, b) => a.name.localeCompare(b.name))

  if (!options.length) return null

  return (
    <Box sx={{ paddingX: 2, paddingBottom: 1 }}>
      <TextField
        select
        fullWidth
        size="small"
        label="Organization"
        value={orgId || userId}
        onChange={event => dispatch.chat.set({ orgId: event.target.value })}
      >
        <MenuItem value={userId}>Personal</MenuItem>
        {options.map(o => (
          <MenuItem key={o.id} value={o.id}>
            {o.name}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  )
}
```

- [ ] **Step 2: Wire into the panel**

In `frontend/src/components/Chat/ChatPanel.tsx`:

1. Import: `import { ChatOrgSelect } from './ChatOrgSelect'`
2. Add `dispatch.chat.syncOrg()` to the open effect:

```typescript
  useEffect(() => {
    if (chat.open) {
      dispatch.chat.resetTransient()
      dispatch.chat.syncOrg()
      dispatch.chat.checkHealth()
    }
  }, [chat.open])
```

3. Render `<ChatOrgSelect />` immediately after the header `<Box>` (the one closing at line 66), before the health notices.

- [ ] **Step 3: Typecheck**

Run: `cd /Users/larrygunteriv/github/remoteit/desktop/frontend && npm run typecheck`
Expected: clean.

- [ ] **Step 4: Manual verification**

1. Start the agent service: `cd /Users/larrygunteriv/github/remoteit/ai-agent && npm run dev` (port 3001).
2. Start the frontend: `cd /Users/larrygunteriv/github/remoteit/desktop/frontend && npm start` (port 3003), sign in, open the chat panel.
3. Verify the dropdown sits below the header and defaults to the org the app sidebar has active (or Personal).
4. With devtools → Network open, send a message with an org selected: the `/api/chat` request body contains `"org":{"id":...,"name":...}`.
5. Select Personal, send again: the body has no `org` key.
6. Switch org mid-conversation and send: transcript is kept; the new org appears in the next request body.
7. Ask the agent to "list this organization's devices": it should use the accountId directly (tool call input shows the selected org id) without a `whoami`/membership lookup first.

- [ ] **Step 5: Commit**

```bash
cd /Users/larrygunteriv/github/remoteit/desktop
git add frontend/src/components/Chat/ChatOrgSelect.tsx frontend/src/components/Chat/ChatPanel.tsx
git commit -m "feat(chat): org selector dropdown in the chat panel"
```
