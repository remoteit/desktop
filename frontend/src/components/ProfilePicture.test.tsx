import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  oidcActor: vi.fn(),
  oidcPicture: vi.fn(),
  oidcSetPicture: vi.fn(),
  setAccountPicture: vi.fn(),
  removeAccountPicture: vi.fn(),
  uiSet: vi.fn(),
}))
vi.mock('../services/oidc', () => ({
  oidcActor: mocks.oidcActor,
  oidcPicture: mocks.oidcPicture,
  oidcSetPicture: mocks.oidcSetPicture,
  oidcSubscribe: () => () => undefined,
}))
vi.mock('../services/permitteerAccount', () => ({
  setAccountPicture: mocks.setAccountPicture,
  removeAccountPicture: mocks.removeAccountPicture,
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_: string, fallback: string) => fallback }) }))
vi.mock('react-redux', () => ({ useDispatch: () => ({ ui: { set: mocks.uiSet } }) }))
vi.mock('./Avatar', () => ({ Avatar: () => null }))

import { ProfilePicture } from './ProfilePicture'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const NEW = 'https://login.example/avatar/a?v=2'

describe('ProfilePicture', () => {
  let root: Root
  let container: HTMLDivElement

  const render = () => act(() => root.render(<ProfilePicture email="ada@x.test" />))
  const button = (label: string) => [...container.querySelectorAll('button')].find(b => b.textContent === label)
  const choose = async (file: File) => {
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })))
  }

  beforeEach(() => {
    Object.values(mocks).forEach(mock => mock.mockReset())
    vi.stubGlobal('createImageBitmap', async () => ({ width: 400, height: 300, close: () => undefined }))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as any)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,AAAA')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uploads the chosen image as a scaled JPEG and shows the picture the AS answers', async () => {
    mocks.setAccountPicture.mockResolvedValue({ status: 200, body: { picture: NEW } })
    render()
    await choose(new File(['x'], 'me.png', { type: 'image/png' }))
    expect(mocks.setAccountPicture).toHaveBeenCalledWith('data:image/jpeg;base64,AAAA')
    expect(mocks.oidcSetPicture).toHaveBeenCalledWith(NEW)
    expect(mocks.uiSet).not.toHaveBeenCalled()
  })

  it('says so when the upload is refused, and keeps the picture it had', async () => {
    mocks.setAccountPicture.mockResolvedValue({ status: 415, body: { error: 'invalid_request' } })
    render()
    await choose(new File(['x'], 'me.png', { type: 'image/png' }))
    expect(mocks.oidcSetPicture).not.toHaveBeenCalled()
    expect(mocks.uiSet).toHaveBeenCalledWith({ errorMessage: 'Your picture could not be changed. Try again.' })
  })

  it('says so when the file is no image it can draw', async () => {
    vi.stubGlobal('createImageBitmap', async () => {
      throw new Error('not an image')
    })
    render()
    await choose(new File(['x'], 'notes.txt', { type: 'text/plain' }))
    expect(mocks.setAccountPicture).not.toHaveBeenCalled()
    expect(mocks.uiSet).toHaveBeenCalledWith({ errorMessage: 'Your picture could not be changed. Try again.' })
  })

  it('offers Remove only when there is a picture, and clears it', async () => {
    render()
    expect(button('Remove')).toBeUndefined()

    mocks.oidcPicture.mockReturnValue('https://login.example/avatar/a?v=1')
    mocks.removeAccountPicture.mockResolvedValue({ status: 200, body: { picture: null } })
    render()
    await act(async () => button('Remove')!.click())
    expect(mocks.removeAccountPicture).toHaveBeenCalled()
    expect(mocks.oidcSetPicture).toHaveBeenCalledWith(null)
  })

  it('offers no changes in a support session', () => {
    mocks.oidcActor.mockReturnValue({ sub: 'operator' })
    mocks.oidcPicture.mockReturnValue('https://login.example/avatar/a?v=1')
    render()
    expect(container.querySelector('button')).toBeNull()
    expect(container.textContent).toContain('Your picture is visible to others.')
  })
})
