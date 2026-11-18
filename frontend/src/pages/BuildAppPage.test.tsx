import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { read, state } = vi.hoisted(() => ({ read: vi.fn(), state: { value: { user: { id: 'U1' }, active: 'U1' } } }))
vi.mock('../services/graphQLAppPublishers', () => ({ graphQLAppPublisher: read }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select(state.value) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: (s: any) => s.active }))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      {header}
      {children}
    </div>
  ),
}))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span>{children}</span> }))
vi.mock('../components/Notice', () => ({
  Notice: ({ children, severity }: any) => <div data-notice={severity}>{children}</div>,
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))

import { BuildAppPage } from './BuildAppPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

/* Build it yourself: the steps named for the publisher, the tool where the stage hosts it, and a starter to download. */

let root: Root
let container: HTMLElement
async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <MemoryRouter>
        <BuildAppPage />
      </MemoryRouter>
    )
  )
  return container
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
beforeEach(() => read.mockReset())

describe('Build it yourself', () => {
  it('names the publisher in the steps, and offers the tool from the stage’s downloads', async () => {
    read.mockResolvedValue({
      publisher: { id: 'acme', keys: [], apps: [] },
      publishing: { certifies: true, downloads: 'https://downloads.test/' },
    })
    const page = await render()
    expect(page.textContent).toContain('remoteit-app sign    dist/acme.hello/1.0.0')
    expect(page.querySelector('[data-build-tool-download]')?.getAttribute('href')).toBe(
      'https://downloads.test/tools/remoteit-app.tgz'
    )
    expect(page.querySelector('[data-build-tool]')?.textContent).toContain(
      'npm install -g https://downloads.test/tools/remoteit-app.tgz'
    )
  })

  it('a stage that hosts no tool says so', async () => {
    read.mockResolvedValue({ publisher: null, publishing: { certifies: false, downloads: null } })
    const page = await render()
    expect(page.querySelector('[data-build-tool] [data-notice]')?.textContent).toContain(
      'does not host the publishing tool'
    )
  })
})
