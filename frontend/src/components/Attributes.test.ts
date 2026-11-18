import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))

import '../store'
import { getAttribute } from './Attributes'

const target = (permissions: IPermission[], service: Partial<IService>) =>
  ['serviceHost', 'servicePort'].map(
    id => getAttribute(id).value({ device: { permissions } as IDevice, service: service as IService }) ?? null
  )

describe("a device service's target", () => {
  it('shows a manager the host and port', () => {
    expect(target(['VIEW', 'MANAGE'], { host: '192.168.1.50', port: 8080 })).toEqual(['192.168.1.50', 8080])
  })

  it('shows a manager a service with no host as targeting the device itself', () => {
    expect(target(['VIEW', 'MANAGE'], { port: 22 })).toEqual(['127.0.0.1', 22])
  })

  it('leaves out both for anyone else, rather than showing a withheld host as 127.0.0.1', () => {
    expect(target(['VIEW', 'CONNECT'], { host: undefined, port: 22 })).toEqual([null, null])
  })
})
