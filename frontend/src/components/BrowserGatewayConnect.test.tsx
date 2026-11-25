import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { openTerminal, dropped } = vi.hoisted(() => ({ openTerminal: vi.fn(), dropped: { value: 0 } }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))
vi.mock('../hooks/useReadAgain', () => ({ useReadAgain: () => dropped.value }))
vi.mock('../helpers/terminalHelper', () => ({ openTerminal, inApp: () => false }))
vi.mock('../buttons/CopyIconButton', () => ({ CopyIconButton: ({ value }: any) => <span data-copy={value} /> }))
vi.mock('./Icon', () => ({ Icon: () => null }))

import { BrowserGatewayConnect } from './BrowserGatewayConnect'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const NAME = 'pi-acme.on.solo.remote.it'
let container: HTMLDivElement
let root: Root
beforeEach(() => {
  openTerminal.mockReset().mockReturnValue(true)
  dropped.value = 0
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
})
const render = (byCertificate?: boolean) =>
  act(async () =>
    root.render(
      <BrowserGatewayConnect name={NAME} port={2222} title="Console" service="S1" byCertificate={byCertificate} />
    )
  )
const open = () => act(async () => container.querySelector('button')!.click())

describe('an SSH service’s terminal', () => {
  it('opens at its name and port, for its service', async () => {
    await render()
    expect(container.textContent).toContain(NAME)
    expect(container.querySelector<HTMLElement>('[data-copy]')!.dataset.copy).toBe(NAME)
    await open()
    expect(openTerminal).toHaveBeenCalledExactlyOnceWith({ name: NAME, port: 2222, title: 'Console', service: 'S1' })
    expect(container.textContent).not.toContain('another account')
  })

  it('says one only another sign-in reaches is not this browser’s, until who serves it changes', async () => {
    openTerminal.mockReturnValue('OTHER_SIGN_IN')
    await render()
    await open()
    expect(container.textContent).toContain('Only another account signed in here reaches this service')
    dropped.value = 1
    await render()
    expect(container.textContent).not.toContain('another account')
  })

  it('offers the plain ssh command of a service that signs people in by certificate', async () => {
    await render(true)
    expect(container.querySelector<HTMLElement>('[data-copy]')!.dataset.copy).toBe(`ssh -p 2222 ${NAME}`)
  })
})
