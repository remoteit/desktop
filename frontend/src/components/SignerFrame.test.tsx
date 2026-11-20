import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))

import { SignerFrame } from './SignerFrame'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

/* The portal's side of the signer: a sandboxed frame without allow-same-origin, told what to do once it is ready, and
   answered only by its own window, in the shape a public key or a signature has. */

const LABELS = {} as any
const KEY = { publicKey: 'B'.repeat(43) + '=', keyId: '0123456789abcdef' }
const SIG = { signature: 'C'.repeat(86) + '==\n', keyId: '0123456789abcdef' }

let root: Root
let container: HTMLElement
async function render(element: React.ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(element))
  return container.querySelector('iframe') as HTMLIFrameElement
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
const from = (source: any, data: any) =>
  act(async () => window.dispatchEvent(new MessageEvent('message', { source, data, origin: 'null' })))

describe('the signer frame', () => {
  it('is sandboxed to an opaque origin and loads signer.html', async () => {
    const frame = await render(
      <SignerFrame request={{ type: 'create', publisher: 'acme', labels: LABELS }} onCreated={vi.fn()} />
    )
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts allow-downloads')
    expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin')
    expect(frame.getAttribute('src')).toMatch(/signer\.html$/)
  })

  it('sends the request once the signer is ready, and takes its own window’s answer alone', async () => {
    const onCreated = vi.fn()
    const request = { type: 'create' as const, publisher: 'acme', labels: LABELS }
    const frame = await render(<SignerFrame request={request} onCreated={onCreated} />)
    const post = vi.spyOn(frame.contentWindow!, 'postMessage')
    await from(frame.contentWindow, { type: 'ready' })
    expect(post).toHaveBeenCalledWith(request, '*')
    await from(window, { type: 'created', ...KEY })
    await from(frame.contentWindow, { type: 'created', publicKey: 'short', keyId: KEY.keyId })
    await from(frame.contentWindow, { type: 'signed', ...SIG })
    expect(onCreated).not.toHaveBeenCalled()
    await from(frame.contentWindow, { type: 'created', ...KEY, pkcs8: 'never taken' })
    expect(onCreated).toHaveBeenCalledWith(KEY)
  })

  it('takes a signature in the shape of one', async () => {
    const onSigned = vi.fn()
    const frame = await render(
      <SignerFrame
        request={{ type: 'sign', publisher: 'acme', manifest: new Uint8Array([1]), keys: [], labels: LABELS }}
        onSigned={onSigned}
      />
    )
    await from(frame.contentWindow, { type: 'signed', signature: 'nope', keyId: SIG.keyId })
    expect(onSigned).not.toHaveBeenCalled()
    await from(frame.contentWindow, { type: 'signed', ...SIG })
    expect(onSigned).toHaveBeenCalledWith(SIG)
  })
})
