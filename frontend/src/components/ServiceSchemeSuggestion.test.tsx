import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { read, cloudUpdateService, updateService, sessions } = vi.hoisted(() => ({
  read: vi.fn(),
  cloudUpdateService: vi.fn().mockResolvedValue(undefined),
  updateService: vi.fn().mockResolvedValue(undefined),
  sessions: { on: true },
}))
vi.mock('../services/graphQLDetectedScheme', () => ({ graphQLDetectedSchemes: read }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => sessions.on }))
vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({ useDispatch: () => ({ devices: { cloudUpdateService, updateService } }) }))
vi.mock('./Notice', () => ({
  Notice: ({ children, button }: any) => (
    <div data-notice>
      {children}
      {button}
    </div>
  ),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { ServiceSchemeSuggestion, schemeSuggestion } from './ServiceSchemeSuggestion'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const device = { id: 'D', configurable: true, permissions: ['MANAGE'] } as unknown as IDevice
const http = { id: 'S', deviceID: 'D', typeID: 7, port: 80, host: 'localhost', name: 'web' } as unknown as IService
const https = { ...http, typeID: 8, port: 443 } as IService

async function render(service: IService, on: IDevice = device) {
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<ServiceSchemeSuggestion device={on} service={service} />))
  return container
}

beforeEach(() => {
  read.mockReset()
  cloudUpdateService.mockClear()
  updateService.mockClear()
  sessions.on = true
})

describe('schemeSuggestion', () => {
  it('suggests HTTPS for an http service that answers https, on the detected port', () => {
    const detected = { set: 'http', serves: 'https', port: 443, detected: null }
    expect(schemeSuggestion(detected, http)).toEqual({ typeID: 8, port: 443, serves: 'https' })
  })

  it('suggests HTTP for an https service that answers plain http', () => {
    const detected = { set: 'https', serves: 'http', port: 8080, detected: null }
    expect(schemeSuggestion(detected, https)).toEqual({ typeID: 7, port: 8080, serves: 'http' })
  })

  it('suggests nothing when nothing was found, or the service already matches', () => {
    expect(schemeSuggestion(null, http)).toBeNull()
    expect(schemeSuggestion({ set: 'http', serves: 'https', port: 443, detected: null }, https)).toBeNull()
    expect(schemeSuggestion({ set: 'http', serves: 'ftp', port: 21, detected: null }, http)).toBeNull()
  })
})

describe('ServiceSchemeSuggestion', () => {
  it('offers HTTPS, and switches the type to 8 on port 443 with the service update', async () => {
    read.mockResolvedValue({ S: { set: 'http', serves: 'https', port: 443, detected: '2026-10-08T00:00:00Z' } })
    const container = await render(http)
    expect(read).toHaveBeenCalledWith('D')
    expect(container.textContent).toContain('This service answers over HTTPS — switch its type to HTTPS (port 443)?')
    await act(async () => container.querySelector('button')!.click())
    expect(cloudUpdateService).toHaveBeenCalledWith({ form: { ...http, typeID: 8, port: 443 }, deviceId: 'D' })
    expect(updateService).toHaveBeenCalledWith({ id: 'S', set: { typeID: 8, port: 443 } })
    expect(container.querySelector('[data-notice]')).toBeNull()
  })

  it('offers plain HTTP the other way round', async () => {
    read.mockResolvedValue({ S: { set: 'https', serves: 'http', port: 8080, detected: null } })
    const container = await render(https)
    expect(container.textContent).toContain('This service answers plain HTTP — switch its type to HTTP (port 8080)?')
    expect(container.textContent).toContain('Switch to HTTP')
  })

  it('shows nothing when nothing was detected, or the API does not serve it', async () => {
    read.mockResolvedValue({ S: null })
    expect((await render(http)).querySelector('[data-notice]')).toBeNull()
    read.mockResolvedValue('UNSUPPORTED')
    expect((await render(http)).querySelector('[data-notice]')).toBeNull()
    expect(cloudUpdateService).not.toHaveBeenCalled()
  })

  it('does not ask for someone who cannot edit the service', async () => {
    read.mockResolvedValue({ S: { set: 'http', serves: 'https', port: 443, detected: null } })
    const viewer = { ...device, permissions: ['VIEW'] } as unknown as IDevice
    expect((await render(http, viewer)).querySelector('[data-notice]')).toBeNull()
    expect(read).not.toHaveBeenCalled()
  })
})
