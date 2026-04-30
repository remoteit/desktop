import {
  buildWindowsTerminalCommand,
  resolveWindowsTerminalCommand,
  WINDOWS_32_BIT_OPENSSH,
} from './launch'

describe('backend/launch', () => {
  describe('resolveWindowsTerminalCommand', () => {
    test('uses Sysnative OpenSSH for plain ssh commands from 32-bit Windows', () => {
      const command = resolveWindowsTerminalCommand('ssh user@example.com -p 2222', true)

      expect(command).toBe(`${WINDOWS_32_BIT_OPENSSH} user@example.com -p 2222`)
    })

    test('uses Sysnative OpenSSH for plain ssh.exe commands from 32-bit Windows', () => {
      const command = resolveWindowsTerminalCommand('ssh.exe user@example.com -p 2222', true)

      expect(command).toBe(`${WINDOWS_32_BIT_OPENSSH} user@example.com -p 2222`)
    })

    test('does not rewrite other commands', () => {
      expect(resolveWindowsTerminalCommand('ssh_config [User]', true)).toBe('ssh_config [User]')
      expect(resolveWindowsTerminalCommand('plink user@example.com -P 2222', true)).toBe('plink user@example.com -P 2222')
    })

    test('does not rewrite 64-bit Windows commands', () => {
      const command = 'ssh user@example.com -p 2222'

      expect(resolveWindowsTerminalCommand(command, false)).toBe(command)
    })
  })

  describe('buildWindowsTerminalCommand', () => {
    test('normalizes existing cmd wrappers before applying the 32-bit ssh fix', () => {
      const command = buildWindowsTerminalCommand('start cmd /k ssh user@example.com -p 2222', true)

      expect(command).toBe(`start cmd /k ${WINDOWS_32_BIT_OPENSSH} user@example.com -p 2222`)
    })
  })
})
