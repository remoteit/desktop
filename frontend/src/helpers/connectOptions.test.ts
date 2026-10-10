import { describe, it, expect } from 'vitest'
import { connectKind, connectOptions } from './connectOptions'

const ids = (options: ReturnType<typeof connectOptions>) => options.map(o => o.id)

describe('connectOptions', () => {
  it('knows a service by its type, the console by its host', () => {
    expect(connectKind({ typeID: 28, host: 'remoteit-console' }, false)).toBe('console')
    expect(connectKind({ typeID: 28, host: 'localhost' }, false)).toBe('ssh')
    expect(connectKind({ typeID: 8, host: 'localhost' }, true)).toBe('web')
    expect(connectKind({ typeID: 5, host: 'localhost' }, false)).toBe('other')
    expect(connectKind(undefined, false)).toBe('other')
  })

  it('is the proxy alone for a service with no name in device subnets', () => {
    for (const kind of ['web', 'ssh', 'console', 'other'] as const) {
      expect(connectOptions(kind, false, false)).toEqual([{ id: 'proxy' }])
      expect(connectOptions(kind, false, true)).toEqual([{ id: 'proxy' }])
    }
  })

  it('offers a web service the proxy and the web client, and the local subnet when this machine reaches it', () => {
    expect(connectOptions('web', true, false)).toEqual([{ id: 'proxy' }, { id: 'browser' }])
    // The agent here answers the name first: the web client's tab would be the subnet's.
    expect(connectOptions('web', true, true)).toEqual([
      { id: 'proxy' },
      { id: 'subnet' },
      { id: 'browser', unavailable: 'agent' },
    ])
  })

  it('greys the web client for a service that is neither web nor SSH', () => {
    expect(connectOptions('other', true, false)).toEqual([{ id: 'proxy' }, { id: 'browser', unavailable: 'type' }])
    expect(ids(connectOptions('other', true, true))).toEqual(['proxy', 'subnet', 'browser'])
  })

  it('offers an SSH service web SSH and a local terminal, by its name when this machine reaches it', () => {
    expect(connectOptions('ssh', true, false)).toEqual([
      { id: 'proxy' },
      { id: 'browserSSH' },
      { id: 'terminal', via: 'proxy' },
    ])
    expect(connectOptions('ssh', true, true)).toEqual([
      { id: 'proxy' },
      { id: 'browserSSH' },
      { id: 'terminal', via: 'subnet' },
    ])
  })

  it('offers the console the same as an SSH service', () => {
    expect(connectOptions('console', true, true)).toEqual(connectOptions('ssh', true, true))
    expect(connectOptions('console', true, false)).toEqual(connectOptions('ssh', true, false))
  })
})
