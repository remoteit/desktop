import { describe, it, expect } from 'vitest'
import { opensTerminal, sshCommand } from './sshHelper'

describe('sshHelper', () => {
  it('is the plain ssh command, the port named only when it is not 22', () => {
    expect(sshCommand('pi-evan.on.remote.it', 2222)).toBe('ssh -p 2222 pi-evan.on.remote.it')
    expect(sshCommand('pi-evan.on.remote.it', 22)).toBe('ssh pi-evan.on.remote.it')
    expect(sshCommand('pi-evan.on.remote.it')).toBe('ssh pi-evan.on.remote.it')
  })

  it('opens a terminal for any app whose service is ssh and that declares person-certificates — none by its id', () => {
    expect(opensTerminal({ protocol: 'ssh', capabilities: ['person-certificates'] })).toBe(true)
    expect(
      opensTerminal({ protocol: 'ssh', capabilities: ['person-accounts', 'person-certificates', 'ssh-exec'] })
    ).toBe(true)
    expect(opensTerminal({ protocol: 'ssh', capabilities: ['ssh-exec'] })).toBe(false)
    expect(opensTerminal({ protocol: 'https', capabilities: ['person-certificates'] })).toBe(false)
    expect(opensTerminal({ protocol: 'udp', capabilities: ['person-certificates'] })).toBe(false)
    expect(opensTerminal({ protocol: null, capabilities: [] })).toBe(false)
    expect(opensTerminal(undefined)).toBe(false)
  })
})
