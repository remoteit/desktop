import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'
import { getApplication } from '@common/applications'

const windowOpen = vi.fn()

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
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const render = (props: Partial<React.ComponentProps<typeof LocalSubnetConnect>> = {}) =>
    act(() =>
      root.render(<LocalSubnetConnect local={{ name: NAME }} service={service} connection={connection} {...props} />)
    )

  it('launches a web service as https on the name, never its own port', () => {
    render()
    act(() => container.querySelector<HTMLButtonElement>('[data-testid="launch"]')!.click())
    expect(windowOpen).toHaveBeenCalledExactlyOnceWith(`https://${NAME}`, '_blank')
  })

  it('shows and copies the URL it launches, scheme included', () => {
    render()
    expect(container.querySelector('[data-testid="copy"]')!.getAttribute('data-value')).toBe(`https://${NAME}`)
    expect(container.textContent).toContain(`https://${NAME}`)
    expect(container.textContent).not.toContain(':8123')
  })

  it('copies a service that is not a web one as name:port', () => {
    render({ service: { ...service, typeID: 1, attributes: {} }, connection: { ...connection, typeID: 1 } })
    expect(container.querySelector('[data-testid="copy"]')!.getAttribute('data-value')).toBe(`${NAME}:8123`)
  })
})
