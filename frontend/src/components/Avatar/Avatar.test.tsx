import { createHash } from 'crypto'
import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../services/oidc', () => ({ oidcPicture: vi.fn() }))
vi.mock('../../helpers/uiHelper', () => ({ createColor: () => 1 }))
vi.mock('../../models/labels', () => ({ labelLookup: { 1: { color: '#888' } } }))

import { Avatar } from './Avatar'
import { oidcPicture } from '../../services/oidc'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

class FakeImage {
  static all: FakeImage[] = []
  src = ''
  onload?: () => void
  onerror?: () => void
  constructor() {
    FakeImage.all.push(this)
  }
}

const EMAIL = 'ada@x.test'
const PICTURE = 'https://idp.example/ada.jpg'
const GRAVATAR = `https://www.gravatar.com/avatar/${createHash('sha256').update(EMAIL).digest('hex')}?s=72&d=404`
const theme = createTheme({ palette: { alwaysWhite: { main: '#fff' }, white: { main: '#fff' } } as any })

describe('Avatar', () => {
  let root: Root
  let container: HTMLDivElement

  const render = (picture?: string, email = EMAIL) =>
    act(() =>
      root.render(
        <ThemeProvider theme={theme}>
          <Avatar email={email} picture={picture} />
        </ThemeProvider>
      )
    )
  const fire = (src: string, event: 'onload' | 'onerror') =>
    act(() => FakeImage.all.filter(i => i.src === src).forEach(i => i[event]?.()))
  const load = (src: string) => fire(src, 'onload')
  const fail = (src: string) => fire(src, 'onerror')
  const shown = () => container.querySelector('img')?.getAttribute('src') ?? container.textContent
  const asked = () => FakeImage.all.map(i => i.src)

  beforeEach(() => {
    FakeImage.all = []
    vi.stubGlobal('Image', FakeImage)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  it('shows the initial until the Permitteer picture loads, then the picture', () => {
    vi.mocked(oidcPicture).mockReturnValue(PICTURE)
    render()
    expect(shown()).toBe('A')
    load(PICTURE)
    expect(shown()).toBe(PICTURE)
  })

  it('falls from the Permitteer picture to Gravatar, and to the initial when both fail', () => {
    vi.mocked(oidcPicture).mockReturnValue(PICTURE)
    render()
    fail(PICTURE)
    expect(asked()).toContain(GRAVATAR)
    fail(GRAVATAR)
    expect(shown()).toBe('A')
  })

  it('keeps the initial when a picture neither loads nor errors', () => {
    vi.mocked(oidcPicture).mockReturnValue(undefined)
    render()
    expect(asked()).toEqual([GRAVATAR])
    expect(shown()).toBe('A')
  })

  it('hashes the email the way Gravatar does: trimmed and lower-cased', () => {
    vi.mocked(oidcPicture).mockReturnValue(undefined)
    render(undefined, ' Ada@X.test ')
    expect(asked()).toEqual([GRAVATAR])
  })

  it('tries a picture it is handed ahead of the lookup', () => {
    vi.mocked(oidcPicture).mockReturnValue(PICTURE)
    render('https://idp.example/given.jpg')
    expect(asked()[0]).toBe('https://idp.example/given.jpg')
  })

  it('ignores a handed picture that is not https', () => {
    vi.mocked(oidcPicture).mockReturnValue(undefined)
    render('http://idp.example/given.jpg')
    expect(asked()).toEqual([GRAVATAR])
  })
})
