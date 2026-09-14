import { describe, it, expect, vi, beforeEach } from 'vitest'

// agentURL() resolves the agent service base per request; isolate it from the store and the
// heavy oidc/constants modules it pulls in at import time.
const state: { ui: { apis: { agentURL?: string } } } = { ui: { apis: {} } }
vi.mock('../store', () => ({ store: { getState: () => state } }))
vi.mock('./oidc', () => ({ oidcAuthHeaders: vi.fn() }))
vi.mock('../constants', () => ({ OAUTH_AGENT_RESOURCE: 'https://agent.remote.it' }))

import { agentURL, isSecureAgentURL } from './agent'

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
