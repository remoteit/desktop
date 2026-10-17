import { createHash } from 'crypto'
import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { listeners } = vi.hoisted(() => ({ listeners: new Set<() => void>() }))
vi.mock('../../services/oidc', () => ({
  oidcPicture: vi.fn(),
  oidcSubscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}))
vi.mock('../../helpers/uiHelper', () => ({ createColor: () => 1 }))
vi.mock('../../models/labels', () => ({ labelLookup: { 1: { color: '#888' } } }))

import { Avatar } from './Avatar'
import { oidcPicture } from '../../services/oidc'
import { rememberPictures } from '../../services/userPictures'

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
const GIVEN = 'https://idp.example/given.jpg'
const KNOWN = 'https://login.example/avatar/ada'
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
    rememberPictures({ email: EMAIL, picture: null })
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  it('shows the initial until the signed-in picture loads, then the picture', () => {
    vi.mocked(oidcPicture).mockReturnValue(PICTURE)
    render()
    expect(shown()).toBe('A')
    load(PICTURE)
    expect(shown()).toBe(PICTURE)
  })

  it("tries the signed-in picture, then one it is handed, then graphql's, then Gravatar, then keeps the initial", () => {
    vi.mocked(oidcPicture).mockReturnValue(PICTURE)
    rememberPictures({ user: { email: EMAIL, picture: KNOWN } })
    render(GIVEN)
    fail(PICTURE)
    fail(GIVEN)
    fail(KNOWN)
    expect(asked()).toEqual([PICTURE, GIVEN, KNOWN, GRAVATAR])
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

  it('shows a new picture once the account registry has it and it loads', () => {
    vi.mocked(oidcPicture).mockReturnValue(undefined)
    render()
    load(GRAVATAR)
    expect(shown()).toBe(GRAVATAR)
    vi.mocked(oidcPicture).mockReturnValue(PICTURE)
    act(() => listeners.forEach(listener => listener()))
    expect(shown()).toBe(GRAVATAR)
    load(PICTURE)
    expect(shown()).toBe(PICTURE)
  })

  it('shows a picture graphql answers after the avatar mounted, keeping the one shown until it loads', () => {
    vi.mocked(oidcPicture).mockReturnValue(undefined)
    render()
    load(GRAVATAR)
    act(() => rememberPictures([{ email: EMAIL.toUpperCase(), picture: KNOWN }]))
    expect(shown()).toBe(GRAVATAR)
    load(KNOWN)
    expect(shown()).toBe(KNOWN)
  })

  it('ignores a handed picture that is not https', () => {
    vi.mocked(oidcPicture).mockReturnValue(undefined)
    render('http://idp.example/given.jpg')
    expect(asked()).toEqual([GRAVATAR])
  })
})
