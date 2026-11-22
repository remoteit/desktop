import { describe, it, expect } from 'vitest'
import type { TFunction } from 'i18next'
import { historyPhrase } from './deviceHistory'
import type { DeviceAboutChange } from '../services/graphQLDeviceAbout'

const t = ((_key: string, text: string, values?: any) =>
  text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as unknown as TFunction

const change = (field: string, before: string | null, after: string | null, kind: DeviceAboutChange['kind'] = 'field') =>
  ({ at: '2026-11-21T10:00:00Z', kind, field, before, after, detail: null, generation: null } as DeviceAboutChange)

describe('historyPhrase', () => {
  it('names an app by what it does, never by its field', () => {
    expect(historyPhrase(t, change('apps.remoteit.console.state', 'starting', 'running')).text).toBe('Terminal started')
    expect(historyPhrase(t, change('apps.acme.backup.version', '1.0', '1.1')).text).toBe('Backup updated to 1.1')
    const detail = historyPhrase(t, change('apps.remoteit.console.detail', 'waiting for its release', 'installing 2.0.0'))
    expect(detail.text).toBe('Terminal status changed')
    expect(detail.detail).toBe('installing 2.0.0')
    expect(detail.text).not.toContain('apps.')
  })

  it('the agent updating, the network changing', () => {
    expect(historyPhrase(t, change('software.connectd', '5.6.0', '5.6.1')).text).toBe('Agent updated to 5.6.1')
    expect(historyPhrase(t, change('network.gatewayId', null, 'eedb34eb5baae791')).text).toBe('Local network detected')
    expect(historyPhrase(t, change('network.gatewayId', 'aa', 'bb')).text).toBe('Moved to another local network')
    expect(historyPhrase(t, change('network.address', null, '192.168.1.20/24')).text).toBe(
      'IP address changed to 192.168.1.20/24'
    )
  })

  it('a terminal sign-in problem, its reason as the detail', () => {
    const phrase = historyPhrase(t, change('ssh.accounts_problem', null, 'admins: sudo is not installed'))
    expect(phrase.text).toBe('Terminal sign-in problem')
    expect(phrase.detail).toBe('admins: sudo is not installed')
    expect(historyPhrase(t, change('ssh.accounts_problem', 'x', null)).text).toBe('Terminal sign-in problem fixed')
  })

  it('accounts added and removed', () => {
    expect(historyPhrase(t, change('accounts.jane', null, '1001, local')).text).toBe('Account jane added')
    expect(historyPhrase(t, change('accounts.jane', '1001, local', null)).text).toBe('Account jane removed')
  })

  it('updates, recoveries and starts as what happened', () => {
    expect(historyPhrase(t, change('failed', null, '1.1.0.10', 'update')).text).toBe('Agent update to 1.1.0.10 failed')
    expect(historyPhrase(t, change('restore', null, 'Portland', 'restore')).text).toBe('Device recovered with a code')
    expect(historyPhrase(t, change('boot', 'key-1', 'Portland', 'boot')).text).toBe('Agent started')
  })

  it('a field it cannot name reads "Setting changed", the raw name only on expand', () => {
    const phrase = historyPhrase(t, change('trust.roots', 'a', 'b'))
    expect(phrase.text).toBe('Setting changed')
    expect(phrase.known).toBe(false)
    expect(phrase.raw).toBe('trust.roots: a → b')
  })

  it('every known field keeps its raw name for the expand, never as the headline', () => {
    for (const field of ['apps.remoteit.console.state', 'network.gatewayId', 'scripts.ticket', 'os.version', 'policy.x']) {
      const phrase = historyPhrase(t, change(field, 'a', 'b'))
      expect(phrase.text).not.toContain(field)
      expect(phrase.raw).toContain(field)
    }
  })
})
