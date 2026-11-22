import { describe, it, expect } from 'vitest'
import { DEVICE_JOIN_KEY_FILE, PRODUCT_JOIN_KEY_FILE, joinKeyContainerCommand, joinKeyFileName } from './joinKeyFile'

const lines = (command: string) => command.split(' \\\n  ')

describe('joinKeyFileName', () => {
  it('names the file for the key, in letters and digits', () => {
    expect(joinKeyFileName(DEVICE_JOIN_KEY_FILE, 'USB stick #2')).toBe('remoteit-device-join-key-usb-stick-2.txt')
    expect(joinKeyFileName(PRODUCT_JOIN_KEY_FILE, '  Line 2 ')).toBe('remoteit-join-key-line-2.txt')
    expect(joinKeyFileName(PRODUCT_JOIN_KEY_FILE, '––')).toBe('remoteit-join-key-key.txt')
  })
})

describe('joinKeyContainerCommand', () => {
  it("a device's key: its file mounted read-only and named, no volume — the device is kept in memory", () => {
    expect(lines(joinKeyContainerCommand('device', 'k.txt'))).toEqual([
      'docker run -d --name remoteit --restart unless-stopped --network host',
      '--cap-add NET_ADMIN --device /dev/net/tun',
      '-e REMOTEIT_JOIN_KEY_FILE=/run/secrets/remoteit_join_key',
      '-v "$PWD/k.txt:/run/secrets/remoteit_join_key:ro"',
      'remoteit/device',
    ])
  })

  it("a product's key: the new device keeps its key in a volume", () => {
    expect(lines(joinKeyContainerCommand('product', 'k.txt'))).toContain('-v remoteit-device:/var/lib/remoteit-device')
  })

  it("an ephemeral product's key: no volume, said so to the entrypoint", () => {
    const command = joinKeyContainerCommand('product', 'k.txt', true)
    expect(lines(command)).toContain('-e R3_ALLOW_NO_VOLUME=1')
    expect(command).not.toContain('/var/lib/remoteit-device')
  })

  it("self-update: a product's device with its volume takes releases itself; one without a volume cannot", () => {
    expect(lines(joinKeyContainerCommand('product', 'k.txt', false, true))).toContain('-e R3_DEVICE_SELF_UPDATE=1')
    expect(joinKeyContainerCommand('product', 'k.txt', false, false)).not.toContain('R3_DEVICE_SELF_UPDATE')
    expect(joinKeyContainerCommand('device', 'k.txt', false, true)).toBe(joinKeyContainerCommand('device', 'k.txt'))
    expect(joinKeyContainerCommand('product', 'k.txt', true, true)).not.toContain('R3_DEVICE_SELF_UPDATE')
  })

  it('a device key ignores the ephemeral flag: it never needs a volume', () => {
    expect(joinKeyContainerCommand('device', 'k.txt', true)).toBe(joinKeyContainerCommand('device', 'k.txt'))
  })

  it('without Access: no NET_ADMIN and no tun device, the rest the same', () => {
    const off = joinKeyContainerCommand('product', 'k.txt', false, true, false)
    expect(off).not.toContain('NET_ADMIN')
    expect(off).not.toContain('/dev/net/tun')
    expect(joinKeyContainerCommand('product', 'k.txt', false, true)).toBe(
      off.replace('--network host', '--network host \\\n  --cap-add NET_ADMIN --device /dev/net/tun')
    )
  })
})
