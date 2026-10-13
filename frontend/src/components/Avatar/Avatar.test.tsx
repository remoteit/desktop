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
const GRAVATAR = `https://www.gravatar.com/avatar/${createHash('sha256').update(EMAIL).digest('hex')}?s=72&d=force-fail`
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
  const fail = (src: string) => act(() => FakeImage.all.filter(i => i.src === src).forEach(i => i.onerror?.()))
  const shown = () => container.querySelector('img')?.getAttribute('src') ?? container.textContent

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

  it('shows the Permitteer picture, then Gravatar, then the initial', () => {
    vi.mocked(oidcPicture).mockReturnValue(PICTURE)
    render()
    expect(shown()).toBe(PICTURE)
    fail(PICTURE)
    expect(shown()).toBe(GRAVATAR)
    fail(GRAVATAR)
    expect(shown()).toBe('A')
  })

  it('starts at Gravatar when Permitteer has no picture for the email', () => {
    vi.mocked(oidcPicture).mockReturnValue(undefined)
    render()
    expect(shown()).toBe(GRAVATAR)
  })

  it('hashes the email the way Gravatar does: trimmed and lower-cased', () => {
    vi.mocked(oidcPicture).mockReturnValue(undefined)
    render(undefined, ' Ada@X.test ')
    expect(shown()).toBe(GRAVATAR)
  })

  it('shows a picture it is handed ahead of the lookup', () => {
    vi.mocked(oidcPicture).mockReturnValue(PICTURE)
    render('https://idp.example/given.jpg')
    expect(shown()).toBe('https://idp.example/given.jpg')
  })

  it('ignores a handed picture that is not https', () => {
    vi.mocked(oidcPicture).mockReturnValue(undefined)
    render('http://idp.example/given.jpg')
    expect(shown()).toBe(GRAVATAR)
  })
})
