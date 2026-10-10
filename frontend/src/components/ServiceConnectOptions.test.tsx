import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { opened } = vi.hoisted(() => ({ opened: [] as string[] }))
vi.mock('./LocalSubnetConnect', () => ({
  LocalSubnetConnect: (props: any) => <div>{`[${props.label}: ${props.local.name}]`}</div>,
}))
vi.mock('./BrowserGatewayConnect', () => ({
  BrowserGatewayConnect: (props: any) => (
    <div>{`[${props.label}: ${props.name}${props.terminal ? ` terminal ${props.terminal.port}` : ''}]`}</div>
  ),
}))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: (props: any) => <button data-launch onClick={props.onClick} />,
}))
vi.mock('../buttons/CopyIconButton', () => ({ CopyIconButton: (props: any) => <i data-copy={props.value} /> }))
vi.mock('../services/browser', () => ({ windowOpen: (url: string) => opened.push(url) }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))

import { connectKind, connectOptions } from '../helpers/connectOptions'
import { ServiceConnectOptions } from './ServiceConnectOptions'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const NAME = 'pi-acme.on.solo.remote.it'

async function render(service: Partial<IService>, local: boolean, connection: Partial<IConnection> = {}, web = false) {
  const container = document.createElement('div')
  const root = createRoot(container)
  const options = connectOptions(connectKind(service as IService, web), true, local)
  await act(async () =>
    root.render(
      <ServiceConnectOptions
        options={options}
        name={NAME}
        local={local ? { name: NAME } : undefined}
        service={service as IService}
        connection={connection as IConnection}
        proxy={<b>[Connect]</b>}
      />
    )
  )
  return container
}

describe('ServiceConnectOptions', () => {
  it('shows a web service the proxy, the local subnet and, greyed with why, the web client', async () => {
    const container = await render({ typeID: 8, host: 'localhost', port: 443 }, true, {}, true)
    expect(container.textContent).toBe(
      'Via proxy[Connect]' +
        `[Via local subnet — no connection to start: ${NAME}]` +
        'Via the web client — in this browserThe agent on this machine answers its name first: use the local subnet'
    )
  })

  it('opens a web service through the web client with no agent here', async () => {
    const container = await render({ typeID: 8, host: 'localhost', port: 443 }, false, {}, true)
    expect(container.textContent).toBe(`Via proxy[Connect][Via the web client — in this browser: ${NAME}]`)
  })

  it('gives an SSH service web SSH and its command by its name on this machine', async () => {
    const container = await render({ typeID: 28, host: 'localhost', port: 2222, id: 'S' }, true)
    expect(container.textContent).toContain(`[Web SSH — a terminal in this browser: ${NAME} terminal 2222]`)
    expect(container.textContent).toContain('Local terminal — by its name on this machine')
    expect(container.querySelector('[data-copy]')?.getAttribute('data-copy')).toBe(`ssh -p 2222 ${NAME}`)
    act(() => (container.querySelector('[data-launch]') as HTMLElement).click())
    expect(opened.pop()).toBe(`ssh://${NAME}:2222`)
  })

  it("gives an SSH service the proxy's address once connected, and asks for the connection before", async () => {
    let container = await render({ typeID: 28, host: 'localhost', port: 22 }, false)
    expect(container.textContent).toContain('Local terminalConnect through the proxy first')
    expect(container.querySelector('[data-copy]')).toBeNull()

    container = await render({ typeID: 28, host: 'localhost', port: 22 }, false, {
      connected: true,
      host: 'proxy.example.com',
      port: 33001,
    })
    expect(container.textContent).toContain('Local terminal — through the proxy')
    expect(container.querySelector('[data-copy]')?.getAttribute('data-copy')).toBe('ssh -p 33001 proxy.example.com')
  })

  it("says where the console's command works", async () => {
    const container = await render({ typeID: 28, host: 'remoteit-console', port: 22 }, true)
    expect(container.querySelector('[data-copy]')?.getAttribute('data-copy')).toBe(`ssh ${NAME}`)
    expect(container.textContent).toContain('Works from a machine signed in on its remote.it device app')
  })
})
