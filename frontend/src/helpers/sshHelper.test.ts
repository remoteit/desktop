import { describe, it, expect } from 'vitest'
import { opensTerminal, sshCommand } from './sshHelper'

describe('sshHelper', () => {
  it('is the plain ssh command, the port named only when it is not 22', () => {
    expect(sshCommand('pi-evan.on.remote.it', 2222)).toBe('ssh -p 2222 pi-evan.on.remote.it')
    expect(sshCommand('pi-evan.on.remote.it', 22)).toBe('ssh pi-evan.on.remote.it')
    expect(sshCommand('pi-evan.on.remote.it')).toBe('ssh pi-evan.on.remote.it')
  })

  it('opens a terminal for an app’s service that is ssh, where the app declares person-certificates — none by its id', () => {
    expect(opensTerminal({ capabilities: ['person-certificates'] }, { protocol: 'ssh' })).toBe(true)
    expect(
      opensTerminal({ capabilities: ['person-accounts', 'person-certificates', 'ssh-exec'] }, { protocol: 'ssh' })
    ).toBe(true)
    expect(opensTerminal({ capabilities: ['ssh-exec'] }, { protocol: 'ssh' })).toBe(false)
    expect(opensTerminal({ capabilities: ['person-certificates'] }, { protocol: 'https' })).toBe(false)
    expect(opensTerminal({ capabilities: ['person-certificates'] }, { protocol: 'udp' })).toBe(false)
    expect(opensTerminal({ capabilities: [] }, { protocol: null })).toBe(false)
    expect(opensTerminal(undefined)).toBe(false)
  })
})
