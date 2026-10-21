import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: any, values?: any) =>
      (typeof text === 'string' ? text : text.defaultValue).replace(
        /{{(\w+)}}/g,
        (_: string, k: string) => (values || text)?.[k] ?? ''
      ),
  }),
}))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./Link', () => ({ Link: ({ to, children }: any) => <a href={to}>{children}</a> }))

import { HostedByLine, hostedStateTooltip } from './HostedBy'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const t = (_key: string, options: any) =>
  options.defaultValue.replace(/{{(\w+)}}/g, (_: string, k: string) => options[k])

async function render(device: Partial<IDevice>, link?: boolean) {
  const container = document.createElement('div')
  await act(async () =>
    createRoot(container).render(
      <MemoryRouter>
        <HostedByLine device={device as IDevice} link={link} />
      </MemoryRouter>
    )
  )
  return container
}

describe('a virtual device says where it lives', () => {
  it('names its gateway to someone who can see it, and links it', async () => {
    const view = await render(
      { virtual: true, hostedBy: { visible: true, id: 'G', name: 'Office gateway', state: 'active' } },
      true
    )
    expect(view.textContent).toBe('via Office gateway')
    expect(view.querySelector('a')?.getAttribute('href')).toBe('/devices/G')
  })

  it('says only "a gateway" to someone who cannot', async () => {
    const view = await render({ virtual: true, hostedBy: { visible: false, state: 'active' } }, true)
    expect(view.textContent).toBe('via a gateway')
    expect(view.querySelector('a')).toBeNull()
  })

  it('"not hosted" once its gateway is gone, and nothing for a device with a daemon', async () => {
    expect((await render({ virtual: true, hostedBy: null })).textContent).toBe('not hosted')
    expect((await render({ virtual: false })).textContent).toBe('')
  })

  it('its state is its gateway’s, and the tooltip says so', () => {
    const office = { visible: true, id: 'G', name: 'Office gateway', state: 'active' as const }
    expect(hostedStateTooltip(t, { virtual: true, hostedBy: office } as IDevice)).toBe(
      'Online while Office gateway is online'
    )
    expect(hostedStateTooltip(t, { virtual: true, hostedBy: { visible: false, state: 'inactive' } } as IDevice)).toBe(
      'Offline while a gateway is offline'
    )
    expect(hostedStateTooltip(t, { virtual: false } as IDevice)).toBeUndefined()
  })
})
