import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// agentURL() resolves the agent service base per request; isolate it from the store and the
// heavy oidc/constants modules it pulls in at import time.
const state: { ui: { apis: { agentURL?: string } } } = { ui: { apis: {} } }
vi.mock('../store', () => ({ store: { getState: () => state } }))
vi.mock('./oidc', () => ({ oidcAuthHeaders: vi.fn() }))
vi.mock('../constants', () => ({ OAUTH_AGENT_RESOURCE: 'https://agent.remote.it' }))

import { agentURL, isSecureAgentURL, streamChat } from './agent'

beforeEach(() => {
  state.ui.apis = {}
})

describe('isSecureAgentURL', () => {
  it('accepts https only (CSP blocks plain http)', () => {
    expect(isSecureAgentURL('https://agent.dev.remote.it')).toBe(true)
    expect(isSecureAgentURL('http://agent.dev.remote.it')).toBe(false)
    expect(isSecureAgentURL('agent.dev.remote.it')).toBe(false)
  })
})

describe('agentURL', () => {
  it('honors a valid https override, trailing slash stripped', () => {
    state.ui.apis = { agentURL: 'https://my-agent.example.com/' }
    expect(agentURL()).toBe('https://my-agent.example.com')
  })

  it('ignores a non-https override and an unset override alike — falling back to the built-in', () => {
    // No toggle any more: a plain field controls it, but only when the value is a valid https URL.
    const fallback = agentURL() // unset
    state.ui.apis = { agentURL: 'http://insecure.example.com' }
    expect(agentURL()).toBe(fallback) // non-https override is ignored
    expect(fallback).not.toContain('insecure') // the fallback is the built-in, never the override
  })
})

/* The turn arrives as SSE. The spec allows CRLF, LF or CR line endings; the parser used to
   recognise only '\n\n', so a CRLF server delivered nothing and every turn finished empty. */
describe('streamChat — SSE framing', () => {
  // A 200 whose body streams the given chunks, one read each
  const sseResponse = (chunks: string[]) => {
    const encoder = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)))
        controller.close()
      },
    })
    return new Response(body, { status: 200 })
  }
  const collect = async (chunks: string[]) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sseResponse(chunks)))
    const events: unknown[] = []
    await streamChat({ conversationId: 'c', text: 'hi', onEvent: event => events.push(event) })
    return events
  }
  const turn = { type: 'turn', turnId: 't1' }
  const done = { type: 'done', stopReason: null }
  afterEach(() => vi.unstubAllGlobals())

  it('parses LF-delimited events (the baseline)', async () => {
    const events = await collect(['event: turn\ndata: {"turnId":"t1"}\n\nevent: done\ndata: {"stopReason":null}\n\n'])
    expect(events).toEqual([turn, done])
  })

  it('parses CRLF-delimited events identically', async () => {
    const events = await collect([
      'event: turn\r\ndata: {"turnId":"t1"}\r\n\r\nevent: done\r\ndata: {"stopReason":null}\r\n\r\n',
    ])
    expect(events).toEqual([turn, done])
  })

  it('handles a CRLF torn across reads — CR ending one chunk, LF opening the next', async () => {
    const events = await collect([
      'event: turn\r\ndata: {"turnId":"t1"}\r',
      '\n\r\nevent: done\r\ndata: {"stopReason":null}\r\n\r\n',
    ])
    expect(events).toEqual([turn, done])
  })

  it('delivers a final event the server closed on without a trailing blank line', async () => {
    const events = await collect(['event: turn\ndata: {"turnId":"t1"}\n\nevent: done\ndata: {"stopReason":null}'])
    expect(events).toEqual([turn, done])
  })

  it('drops a torn tail rather than surfacing a parse error over a finished turn', async () => {
    const events = await collect(['event: turn\ndata: {"turnId":"t1"}\n\nevent: text_delta\ndata: {"text":"tru'])
    expect(events).toEqual([turn])
  })
})
