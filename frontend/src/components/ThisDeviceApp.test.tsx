import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

vi.mock('./Panel', () => ({ Panel: ({ children, header }: any) => <div data-header={String(header)}>{children}</div> }))
vi.mock('../pages/ThisDevicePage', () => ({ ThisDevicePage: () => <div data-page="this-device" /> }))

import { ThisDeviceApp } from './ThisDeviceApp'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// Signed out in an app, This device is the portal's home: every address lands on it, and nothing of the account's
// (the nav, the header) draws.

const layout = { sidePanelWidth: 200 } as ILayout

async function at(path: string) {
  let location = ''
  const container = document.createElement('div')
  await act(async () =>
    createRoot(container).render(
      <MemoryRouter initialEntries={[path]}>
        <ThisDeviceApp layout={layout} />
        <Route render={({ location: l }) => ((location = l.pathname), null)} />
      </MemoryRouter>
    )
  )
  return { container, location: () => location }
}

describe('This device, signed out in an app', () => {
  it.each(['/', '/devices', '/connections/ABC', '/account', '/this-device'])('lands %s on This device', async path => {
    const { container, location } = await at(path)
    expect(location()).toBe('/this-device')
    expect(container.querySelector('[data-page="this-device"]')).not.toBeNull()
    expect(container.querySelector('[data-header]')!.getAttribute('data-header')).toBe('false')
  })
})
