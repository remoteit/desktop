import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'
import { getApplication } from '@common/applications'

const windowOpen = vi.fn()
const names = vi.hoisted(() => ({ answer: true as boolean | undefined, set: vi.fn() }))

vi.mock('../services/browser', () => ({ default: {}, windowOpen: (...args: unknown[]) => windowOpen(...args) }))
vi.mock('../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('../helpers/connectionHelper', () => ({ saveLaunchTokens: vi.fn() }))
vi.mock('../services/localPorts', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/localPorts')>()),
  namesResolve: async () => names.answer,
  setNamesResolve: (on: boolean) => names.set(on),
}))
vi.mock('../hooks/useApplication', () => ({
  useApplication: (service?: IService, connection?: IConnection) => getApplication(service, connection),
}))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ onClick, icon }: { onClick: () => void; icon: string }) => <button data-testid={icon} onClick={onClick} />,
}))
vi.mock('../buttons/CopyIconButton', () => ({
  CopyIconButton: ({ value }: { value: string }) => <span data-testid="copy" data-value={value} />,
}))
vi.mock('./PromptModal', () => ({ PromptModal: () => null }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./Link', () => ({ Link: ({ onClick, children }: any) => <a onClick={onClick}>{children}</a> }))

import { LocalPortConnect } from './LocalPortConnect'
import type { LocalPortState } from '../hooks/useLocalPort'
import type { LocalPort } from '../services/localPorts'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const service: IService = {
  ...DEFAULT_SERVICE,
  id: '90:00:00:00:00:00:00:30',
  deviceID: '90:00:00:00:00:00:00:2F',
  name: 'UI',
  typeID: 7,
  port: 8123,
  host: '127.0.0.1',
  attributes: { launchTemplate: 'http://[host]:[port]' },
}
const connection: IConnection = { ...DEFAULT_CONNECTION, id: service.id, typeID: 7 }

const LOCAL: LocalPort = {
  deviceId: '80:00:00:00:00:00:00:A1',
  serviceId: service.id,
  name: 'ui-pi',
  host: 'ui-pi.at.remote.it',
  port: 33000,
  open: true,
  state: 'listening',
  detail: null,
  initiatorId: 'i1',
  https: false,
  httpsAvailable: false,
}

describe('LocalPortConnect', () => {
  let container: HTMLDivElement
  let root: Root
  let state: LocalPortState

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    windowOpen.mockClear()
    names.answer = true
    names.set.mockClear()
    state = { offered: true, local: LOCAL, busy: false, open: vi.fn(), close: vi.fn() }
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const render = async (props: Partial<React.ComponentProps<typeof LocalPortConnect>> = {}) => {
    await act(async () => root.render(<LocalPortConnect state={state} service={service} connection={connection} {...props} />))
  }
  const copied = () => container.querySelector('[data-testid="copy"]')!.getAttribute('data-value')

  it('a web service: shown, copied and launched as http on the name and its port', async () => {
    await render()
    expect(copied()).toBe('http://ui-pi.at.remote.it:33000')
    expect(container.textContent).toContain('http://ui-pi.at.remote.it:33000')
    act(() => container.querySelector<HTMLButtonElement>('[data-testid="launch"]')!.click())
    expect(windowOpen).toHaveBeenCalledExactlyOnceWith('http://ui-pi.at.remote.it:33000', '_blank')
  })

  it('where the name does not resolve: localhost, and the person can switch back', async () => {
    names.answer = false
    await render()
    expect(copied()).toBe('http://localhost:33000')
    const link = [...container.querySelectorAll('a')].find(a => a.textContent?.startsWith('Use ui-pi'))!
    act(() => link.click())
    expect(names.set).toHaveBeenCalledWith(true)
    expect(copied()).toBe('http://ui-pi.at.remote.it:33000')
  })

  it('unknown whether the name resolves: the name', async () => {
    names.answer = undefined
    await render()
    expect(copied()).toBe('http://ui-pi.at.remote.it:33000')
  })

  it('a service that is not a web one: name:port; ssh: the command', async () => {
    await render({ service: { ...service, typeID: 1, attributes: {} }, connection: { ...connection, typeID: 1 } })
    expect(copied()).toBe('ui-pi.at.remote.it:33000')
    await render({ service: { ...service, typeID: 28, attributes: {} }, connection: { ...connection, typeID: 28 } })
    expect(copied()).toContain('ssh')
    expect(copied()).toContain('ui-pi.at.remote.it')
    expect(copied()).toContain('33000')
  })

  it('disconnect closes it; a port of the person\'s own opens it there', async () => {
    await render()
    act(() => container.querySelector<HTMLButtonElement>('[data-testid="power-off"]')!.click())
    expect(state.close).toHaveBeenCalled()

    act(() => [...container.querySelectorAll('a')].find(a => a.textContent === 'Change port')!.click())
    const input = container.querySelector('input')!
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(input, '8080')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => [...container.querySelectorAll('a')].find(a => a.textContent === 'Use this port')!.click())
    expect(state.open).toHaveBeenCalledWith(8080)
  })

  const link = (text: string) => [...container.querySelectorAll('a')].find(a => a.textContent === text)

  it('served over https: shown, copied and launched as https on the name; http offered as the way out', async () => {
    state.local = { ...LOCAL, https: true, httpsAvailable: true }
    await render()
    expect(copied()).toBe('https://ui-pi.at.remote.it:33000')
    act(() => container.querySelector<HTMLButtonElement>('[data-testid="launch"]')!.click())
    expect(windowOpen).toHaveBeenCalledExactlyOnceWith('https://ui-pi.at.remote.it:33000', '_blank')
    expect(link('Use https')).toBeUndefined()
    act(() => link('Does not open? Use http instead')!.click())
    expect(state.open).toHaveBeenCalledWith(undefined, false)
  })

  it('https available but plain: http, and https offered; not available: neither link', async () => {
    state.local = { ...LOCAL, httpsAvailable: true }
    await render()
    expect(copied()).toBe('http://ui-pi.at.remote.it:33000')
    act(() => link('Use https')!.click())
    expect(state.open).toHaveBeenCalledWith(undefined, true)

    state.local = { ...LOCAL }
    await render()
    expect(link('Use https')).toBeUndefined()
    expect(link('Does not open? Use http instead')).toBeUndefined()
  })

  it('https, then localhost: the certificate names the name alone, so plain from there', async () => {
    state.local = { ...LOCAL, https: true, httpsAvailable: true }
    await render()
    act(() => link('Name does not open? Use localhost')!.click())
    expect(state.open).toHaveBeenCalledWith(undefined, false)
  })

  it('not a web service: never https links', async () => {
    state.local = { ...LOCAL, https: false, httpsAvailable: true }
    await render({ service: { ...service, typeID: 28, attributes: {} }, connection: { ...connection, typeID: 28 } })
    expect(link('Use https')).toBeUndefined()
  })

  it('says why it is not listening', async () => {
    state.local = { ...LOCAL, state: 'failed', detail: 'bind: address already in use' }
    await render()
    expect(container.querySelector('[data-testid="local-port-state"]')!.textContent).toContain('address already in use')
  })
})
