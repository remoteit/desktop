import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'
import { getApplication } from '@common/applications'

const windowOpen = vi.fn()
const { detect, sessions } = vi.hoisted(() => ({ detect: vi.fn(), sessions: { on: true } }))

vi.mock('../services/browser', () => ({ default: {}, windowOpen: (...args: unknown[]) => windowOpen(...args) }))
vi.mock('../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('../helpers/connectionHelper', () => ({ saveLaunchTokens: vi.fn() }))
vi.mock('../hooks/useApplication', () => ({
  useApplication: (service?: IService, connection?: IConnection) => getApplication(service, connection),
}))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ onClick }: { onClick: () => void }) => <button data-testid="launch" onClick={onClick} />,
}))
vi.mock('../buttons/CopyIconButton', () => ({
  CopyIconButton: ({ value }: { value: string }) => <span data-testid="copy" data-value={value} />,
}))
vi.mock('./PromptModal', () => ({ PromptModal: () => null }))
vi.mock('../hooks/useDeviceSessions', () => ({
  useDeviceSessions: () => sessions.on,
  selectDeviceSessions: () => sessions.on,
}))
vi.mock('../services/graphQLDetectedScheme', async () => {
  const { redirectLoops } = await vi.importActual<typeof import('../services/graphQLDetectedScheme')>(
    '../services/graphQLDetectedScheme'
  )
  return { graphQLDetectedSchemes: detect, redirectLoops }
})
vi.mock('./Confirm', () => ({
  Confirm: ({ open, children, onConfirm, onDeny }: any) =>
    open ? (
      <div data-testid="confirm">
        {children}
        <button data-testid="anyway" onClick={onConfirm} />
        <button data-testid="cancel" onClick={onDeny} />
      </div>
    ) : null,
}))
vi.mock('./Icon', () => ({ Icon: () => null }))

import { LocalSubnetConnect } from './LocalSubnetConnect'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const NAME = 'homeassistant-evan.on.solo.remote.it'

// Home Assistant's UI: an http service on 8123 behind 127.0.0.1, launched by the template https://[host]:[port].
const service: IService = {
  ...DEFAULT_SERVICE,
  id: '90:00:00:00:00:00:00:30',
  deviceID: '90:00:00:00:00:00:00:2F',
  name: 'UI',
  typeID: 7,
  port: 8123,
  host: '127.0.0.1',
  attributes: { launchTemplate: 'https://[host]:[port]' },
}

// A phone's: never started, so no host or port — the name is what reaches the service.
const connection: IConnection = { ...DEFAULT_CONNECTION, id: service.id, typeID: 7, public: true }

describe('LocalSubnetConnect', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    windowOpen.mockClear()
    detect.mockReset().mockResolvedValue({})
    sessions.on = true
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const render = (props: Partial<React.ComponentProps<typeof LocalSubnetConnect>> = {}) =>
    act(async () =>
      root.render(<LocalSubnetConnect local={{ name: NAME }} service={service} connection={connection} {...props} />)
    )
  const click = (id: string) => act(() => container.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!.click())

  // The UniFi Dream Machine Pro behind HA Derby: plain HTTP on 80, every request redirected to https:// on the name.
  const dmPro: IService = {
    ...service,
    id: '90:00:00:00:00:00:00:32',
    name: 'DM Pro Derby',
    port: 80,
    host: '192.168.1.1',
  }
  const passed = { set: 'http', serves: 'https', port: 443, detected: null, redirect: 'passed' }

  it('warns before launching a web service whose redirect to HTTPS would loop, and opens it only if asked', async () => {
    detect.mockResolvedValue({ [dmPro.id]: passed })
    await render({ service: dmPro })
    expect(detect).toHaveBeenCalledWith(dmPro.deviceID)
    await click('launch')
    expect(windowOpen).not.toHaveBeenCalled()
    expect(container.querySelector('[data-testid="confirm"]')!.textContent).toContain(
      'This service redirects to HTTPS, so its page would keep sending the browser back to itself. Switch it to port 443 (HTTPS)'
    )
    await click('cancel')
    expect(container.querySelector('[data-testid="confirm"]')).toBeNull()
    expect(windowOpen).not.toHaveBeenCalled()
    await click('launch')
    await click('anyway')
    expect(windowOpen).toHaveBeenCalledExactlyOnceWith(`https://${NAME}`, '_blank')
  })

  it('launches at once when the device follows the redirect, or the service is already HTTPS on its port', async () => {
    detect.mockResolvedValue({ [dmPro.id]: { ...passed, redirect: 'followed' } })
    await render({ service: dmPro })
    await click('launch')
    expect(windowOpen).toHaveBeenCalledTimes(1)
    detect.mockResolvedValue({ [dmPro.id]: passed })
    await render({ service: { ...dmPro, typeID: 8, port: 443 } })
    await click('launch')
    expect(windowOpen).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[data-testid="confirm"]')).toBeNull()
  })

  it('asks nothing without device sessions, or for a service that is not a web one', async () => {
    sessions.on = false
    await render({ service: dmPro })
    sessions.on = true
    await render({ service: { ...dmPro, typeID: 1, attributes: {} }, connection: { ...connection, typeID: 1 } })
    expect(detect).not.toHaveBeenCalled()
  })

  it('launches a web service as https on the name, never its own port', async () => {
    await render()
    await click('launch')
    expect(windowOpen).toHaveBeenCalledExactlyOnceWith(`https://${NAME}`, '_blank')
  })

  it('shows and copies the URL it launches, scheme included', async () => {
    await render()
    expect(container.querySelector('[data-testid="copy"]')!.getAttribute('data-value')).toBe(`https://${NAME}`)
    expect(container.textContent).toContain(`https://${NAME}`)
    expect(container.textContent).not.toContain(':8123')
  })

  it('copies a service that is not a web one as name:port', async () => {
    await render({ service: { ...service, typeID: 1, attributes: {} }, connection: { ...connection, typeID: 1 } })
    expect(container.querySelector('[data-testid="copy"]')!.getAttribute('data-value')).toBe(`${NAME}:8123`)
  })
})
