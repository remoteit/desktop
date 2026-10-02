import { isLoopback } from './loopback'

describe('backend/loopback', () => {
  it('accepts this computer in every form socket.io reports it', () => {
    for (const address of ['127.0.0.1', '127.0.0.53', '::1', '::ffff:127.0.0.1']) expect(isLoopback(address)).toBe(true)
  })

  it('refuses LAN and missing addresses', () => {
    for (const address of ['192.168.0.186', '::ffff:192.168.0.186', 'fe80::1', '127.0.0.1.evil', '', undefined])
      expect(isLoopback(address)).toBe(false)
  })
})
