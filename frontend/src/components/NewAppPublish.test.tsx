import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { publish, SIGNED } = vi.hoisted(() => ({
  publish: vi.fn(),
  SIGNED: { signature: 'A'.repeat(86) + '==\n', keyId: '0123456789abcdef' },
}))
vi.mock('../services/graphQLAppRelease', () => ({ publishRelease: publish }))
// The signer stands in for signer.html: what it was asked to sign is shown, and a click answers with a signature.
vi.mock('./SignerFrame', () => ({
  useSignLabels: () => ({}),
  SignerFrame: ({ request, onSigned }: any) => (
    <button
      data-signer={request.type}
      data-signer-bytes={new TextDecoder().decode(request.manifest)}
      data-signer-keys={request.keys.length}
      onClick={() => onSigned(SIGNED)}
    />
  ),
}))
vi.mock('./Notice', () => ({ Notice: ({ children, severity }: any) => <div data-notice={severity}>{children}</div> }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { NewAppPublish } from './NewAppPublish'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

/* Review and sign: the manifest shown as signed; a root app's explicit word before signing; the signer given exactly
   the manifest's bytes and the standing keys; the release published with the signature, and a failure retried with
   the same one. */

const KEYS = [{ keyId: '0123456789abcdef', publicKey: 'x' }]
const built = (as?: string) => {
  const manifest = {
    contract: 1,
    app: 'acme.panel',
    version: '1.0.0',
    run: { command: 'bin/panel', ...(as ? { as } : {}) },
  }
  const text = `${JSON.stringify(manifest, null, 2)}\n`
  return {
    manifest,
    text,
    bytes: new TextEncoder().encode(text),
    archives: [{ name: 'a.tar.gz', data: new Uint8Array([1]) }],
  }
}

let root: Root
let container: HTMLElement
async function render(element: React.ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(element))
  return container
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
beforeEach(() => publish.mockReset())
const click = (el: Element | null) => act(async () => (el as HTMLElement).click())

describe('Review and sign', () => {
  it('a root app: nothing is signed before the publisher’s explicit word', async () => {
    const onPublished = vi.fn()
    publish.mockResolvedValue({ ok: { manifest: 'https://d/m', devices: 0 } })
    const page = await render(
      <NewAppPublish built={built('root') as any} publisher="acme" keys={KEYS} onPublished={onPublished} />
    )
    expect(page.querySelector('[data-review-manifest]')?.textContent).toBe(built('root').text)
    const sign = page.querySelector('[data-sign-publish]') as HTMLButtonElement
    expect(sign.disabled).toBe(true)
    await click(page.querySelector('[data-root-ok]'))
    expect(sign.disabled).toBe(false)
    await click(sign)
    const signer = document.querySelector('[data-signer="sign"]')!
    expect(signer.getAttribute('data-signer-bytes')).toBe(built('root').text)
    expect(signer.getAttribute('data-signer-keys')).toBe('1')
    await click(signer)
    const [app, version, files] = publish.mock.calls[0]
    expect([app, version, files.map((f: any) => f.name)]).toEqual([
      'acme.panel',
      '1.0.0',
      ['a.tar.gz', 'manifest.json', 'manifest.json.sig'],
    ])
    expect(new TextDecoder().decode(files[2].data)).toBe(SIGNED.signature)
    expect(onPublished).toHaveBeenCalledWith({ manifest: 'https://d/m', devices: 0 })
  })

  it('a restricted app signs at once; a failure is said and retried with the same signature', async () => {
    publish
      .mockResolvedValueOnce({ reason: 'manifest.json: 403 Forbidden' })
      .mockResolvedValueOnce({ ok: { manifest: 'https://d/m', devices: 2 } })
    const onPublished = vi.fn()
    const page = await render(
      <NewAppPublish built={built() as any} publisher="acme" keys={KEYS} onPublished={onPublished} />
    )
    expect(page.querySelector('[data-root-ok]')).toBeNull()
    await click(page.querySelector('[data-sign-publish]'))
    await click(document.querySelector('[data-signer="sign"]'))
    expect(page.querySelector('[data-publish-refusal]')?.textContent).toBe('manifest.json: 403 Forbidden')
    await click(page.querySelector('[data-publish-again]'))
    expect(publish).toHaveBeenCalledTimes(2)
    expect(publish.mock.calls[1][3]).toBe(publish.mock.calls[0][3]) // the same record of what is up already
    expect(new TextDecoder().decode(publish.mock.calls[1][2][2].data)).toBe(SIGNED.signature)
    expect(onPublished).toHaveBeenCalled()
  })

  it('holds the page while it signs and publishes, and a review left behind says nothing', async () => {
    let finish: (value: any) => void = () => {}
    publish.mockReturnValue(new Promise(resolve => (finish = resolve)))
    const onBusy = vi.fn()
    const onPublished = vi.fn()
    const page = await render(
      <NewAppPublish built={built() as any} publisher="acme" keys={KEYS} onPublished={onPublished} onBusy={onBusy} />
    )
    await click(page.querySelector('[data-sign-publish]'))
    expect(onBusy).toHaveBeenLastCalledWith(true)
    await click(document.querySelector('[data-signer="sign"]'))
    expect(onBusy).toHaveBeenLastCalledWith(true)
    act(() => root.unmount())
    await act(async () => finish({ ok: { manifest: 'https://d/m', devices: 1 } }))
    expect(onPublished).not.toHaveBeenCalled()
    root = createRoot(container) // for afterEach
  })

  it('without a standing key, nothing can be signed', async () => {
    const page = await render(<NewAppPublish built={built() as any} publisher="acme" keys={[]} onPublished={vi.fn()} />)
    expect((page.querySelector('[data-sign-publish]') as HTMLButtonElement).disabled).toBe(true)
  })
})
