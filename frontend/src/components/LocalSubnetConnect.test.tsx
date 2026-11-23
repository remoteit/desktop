import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'
import { initialize } from '@common/adaptor'
import { getApplication } from '@common/applications'

const openServiceURL = vi.fn()
const { detect, sessions } = vi.hoisted(() => ({ detect: vi.fn(), sessions: { on: true } }))

vi.mock('../services/browser', () => ({ default: {}, openServiceURL: (...args: unknown[]) => openServiceURL(...args) }))
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

// The cloud's types: ScreenView (48) is proxied as web with no scheme of its own; 4848 is proxied, and not web.
const environment = { portal: true } as IEnvironment
initialize({
  getState: () => ({ environment, preferences: {} as IPreferences }),
  getCloudData: typeId =>
    ({ proxy: typeId === 7 || typeId === 48 || typeId === 4848, scheme: typeId === 7 ? 'http' : typeId === 4848 ? 'wss' : '' } as IApplicationType),
  escapeRegex: string => string,
})

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
    openServiceURL.mockClear()
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
    await render({ service: dmPro, defaultHttp: true })
    expect(detect).toHaveBeenCalledWith(dmPro.deviceID)
    await click('launch')
    expect(openServiceURL).not.toHaveBeenCalled()
    expect(container.querySelector('[data-testid="confirm"]')!.textContent).toContain(
      'This service redirects to HTTPS, so its page would keep sending the browser back to itself. Switch it to port 443 (HTTPS)'
    )
    await click('cancel')
    expect(container.querySelector('[data-testid="confirm"]')).toBeNull()
    expect(openServiceURL).not.toHaveBeenCalled()
    await click('launch')
    await click('anyway')
    expect(openServiceURL).toHaveBeenCalledExactlyOnceWith(`https://${NAME}`)
  })

  it('launches at once when the device follows the redirect, or the service is already HTTPS on its port', async () => {
    detect.mockResolvedValue({ [dmPro.id]: { ...passed, redirect: 'followed' } })
    await render({ service: dmPro })
    await click('launch')
    expect(openServiceURL).toHaveBeenCalledTimes(1)
    detect.mockResolvedValue({ [dmPro.id]: passed })
    await render({ service: { ...dmPro, typeID: 8, port: 443 } })
    await click('launch')
    expect(openServiceURL).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[data-testid="confirm"]')).toBeNull()
  })

  it('asks nothing without device sessions, or for a service that is not a web one', async () => {
    sessions.on = false
    await render({ service: dmPro })
    sessions.on = true
    await render({ service: { ...dmPro, typeID: 1, attributes: {} }, connection: { ...connection, typeID: 1 } })
    expect(detect).not.toHaveBeenCalled()
  })

  it('launches two web services on the same name at their respective ports', async () => {
    await render()
    await click('launch')
    expect(openServiceURL).toHaveBeenLastCalledWith(`https://${NAME}:8123`)
    await render({ service: { ...service, port: 80 }, defaultHttp: true })
    await click('launch')
    expect(openServiceURL).toHaveBeenLastCalledWith(`https://${NAME}`)
  })

  it('launches on explicit port 80 without warning about a redirect to a separate HTTPS port', async () => {
    detect.mockResolvedValue({ [dmPro.id]: passed })
    await render({ service: dmPro, defaultHttp: false })
    await click('launch')
    expect(openServiceURL).toHaveBeenCalledExactlyOnceWith(`https://${NAME}:80`)
    expect(container.querySelector('[data-testid="confirm"]')).toBeNull()
  })

  it('uses the usual HTTPS port when the service has its own name', async () => {
    await render({ port: 443 })
    await click('launch')
    expect(openServiceURL).toHaveBeenCalledExactlyOnceWith(`https://${NAME}`)
  })

  it('shows and copies the URL it launches, scheme and port included', async () => {
    await render()
    expect(container.querySelector('[data-testid="copy"]')!.getAttribute('data-value')).toBe(`https://${NAME}:8123`)
    expect(container.textContent).toContain(`https://${NAME}:8123`)
  })

  // As the portal opens it on a Mac with the app: a saved connection from the proxy is public there.
  it('launches ScreenView at the URL it copies, port included', async () => {
    await render({
      service: { ...service, typeID: 48, port: 8959, attributes: {} },
      connection: { ...connection, typeID: 48 },
    })
    await click('launch')
    expect(openServiceURL).toHaveBeenCalledExactlyOnceWith(`https://${NAME}:8959`)
    expect(container.querySelector('[data-testid="copy"]')!.getAttribute('data-value')).toBe(`https://${NAME}:8959`)
  })

  it("keeps the port in a launch template: only the cloud proxy's address goes without one", async () => {
    await render({
      service: { ...service, typeID: 4848, port: 9000, attributes: { launchTemplate: 'https://[host]:[port]/app' } },
      connection: { ...connection, typeID: 4848, launchType: 'URL' },
    })
    await click('launch')
    expect(openServiceURL).toHaveBeenCalledExactlyOnceWith(`https://${NAME}:9000/app`)
  })

  it('copies a service that is not a web one as name:port', async () => {
    await render({ service: { ...service, typeID: 1, attributes: {} }, connection: { ...connection, typeID: 1 } })
    expect(container.querySelector('[data-testid="copy"]')!.getAttribute('data-value')).toBe(`${NAME}:8123`)
  })
})
