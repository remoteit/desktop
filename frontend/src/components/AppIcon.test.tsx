import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./Icon', () => ({ Icon: ({ name }: any) => <i data-icon={name} /> }))

import { AppIcon } from './AppIcon'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

/* An app's own icon where it has one, served by remote.it over https; else — none, an older remote.it, one that does
   not load, anything but https — the icon of how its service opens. */

let root: Root
let container: HTMLElement
const render = async (element: React.ReactElement) => {
  container = document.createElement('div')
  root = createRoot(container)
  await act(async () => root.render(element))
  return container
}
afterEach(() => act(() => root.unmount()))

describe('an app’s icon', () => {
  it('its own, drawn as an image', async () => {
    const page = await render(
      <AppIcon icon="https://downloads.test/apps/acme.x/1.0.0/acme.x-1.0.0-icon.png" protocol="http" size="md" />
    )
    expect(page.querySelector('img[data-app-icon]')?.getAttribute('src')).toBe(
      'https://downloads.test/apps/acme.x/1.0.0/acme.x-1.0.0-icon.png'
    )
    await act(async () => page.querySelector('img')!.dispatchEvent(new Event('error')))
    expect(page.querySelector('img')).toBeNull()
    expect(page.querySelector('[data-icon]')?.getAttribute('data-icon')).toBe('globe')
  })

  it('none, or anything but https: its protocol’s', async () => {
    expect(
      (await render(<AppIcon protocol="ssh" size="md" />)).querySelector('[data-icon]')?.getAttribute('data-icon')
    ).toBe('terminal')
    act(() => root.unmount())
    const page = await render(<AppIcon icon="javascript:alert(1)" protocol={null} size="md" />)
    expect(page.querySelector('img')).toBeNull()
    expect(page.querySelector('[data-icon]')?.getAttribute('data-icon')).toBe('cube')
  })
})
