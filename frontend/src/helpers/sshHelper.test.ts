import { describe, it, expect } from 'vitest'
import { isConsoleService, sshCommand } from './sshHelper'

describe('sshHelper', () => {
  it('is the plain ssh command, the port named only when it is not 22', () => {
    expect(sshCommand('pi-evan.on.remote.it', 2222)).toBe('ssh -p 2222 pi-evan.on.remote.it')
    expect(sshCommand('pi-evan.on.remote.it', 22)).toBe('ssh pi-evan.on.remote.it')
    expect(sshCommand('pi-evan.on.remote.it')).toBe('ssh pi-evan.on.remote.it')
  })

  it('knows the console by its host, an SSH service', () => {
    expect(isConsoleService({ typeID: 28, host: 'remoteit-console' })).toBe(true)
    expect(isConsoleService({ typeID: 28, host: 'localhost' })).toBe(false)
    expect(isConsoleService({ typeID: 8, host: 'remoteit-console' })).toBe(false)
    expect(isConsoleService(undefined)).toBe(false)
  })
})
