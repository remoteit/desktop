import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'
import { forgetAccountCaches } from '../services/accountCaches'
import { useReadCallback, useReadEffect } from './useReadAgain'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

/* A page reads for itself, and the person is half way through a form on it, when another sign-in comes to serve the
   account (models/accounts readAgain drops what is stored, services/accountCaches). The page reads again where it is. */
describe('a page’s own reads, when accounts’ data is dropped', () => {
  const mount = async (page: React.ReactElement) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    await act(async () => root.render(page))
    return { container, root }
  }
  const type = (input: HTMLInputElement, text: string) =>
    act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

  it('are made again, the page not mounted again: what was typed into it is still there', async () => {
    const read = vi.fn(async (id: string) => `${id} as ${read.mock.calls.length === 1 ? 'work' : 'personal'}`)
    const mounted = vi.fn()
    const Page: React.FC<{ id: string }> = ({ id }) => {
      const [shown, setShown] = useState<string>()
      const [draft, setDraft] = useState('')
      React.useEffect(mounted, [])
      useReadEffect(() => {
        read(id).then(setShown)
      }, [id])
      return (
        <form>
          <output>{shown}</output>
          <input value={draft} onChange={event => setDraft(event.target.value)} />
        </form>
      )
    }
    const { container } = await mount(<Page id="acme" />)
    const input = container.querySelector('input')!
    await type(input, 'half a sentence')
    expect(container.querySelector('output')!.textContent).toBe('acme as work')

    await act(async () => forgetAccountCaches(['acme']))
    expect(read).toHaveBeenCalledTimes(2)
    expect(container.querySelector('output')!.textContent).toBe('acme as personal')
    expect(container.querySelector('input')).toBe(input)
    expect(input.value).toBe('half a sentence')
    expect(mounted).toHaveBeenCalledTimes(1)
  })

  it('leave alone what the effect clears for something else being shown, so nothing under it is taken down', async () => {
    const runs: [string, boolean][] = []
    const load = vi.fn(async () => {})
    const Page: React.FC<{ id: string }> = ({ id }) => {
      const read = useReadCallback(() => load(), [id])
      useReadEffect(again => void runs.push([id, again]), [id])
      // An effect that runs its read when the read changes is told the same.
      useReadEffect(again => void (runs.push([`${id}:load`, again]), read()), [read])
      return null
    }
    const { root } = await mount(<Page id="acme" />)
    await act(async () => forgetAccountCaches(['acme']))
    await act(async () => root.render(<Page id="labs" />))
    await act(async () => forgetAccountCaches(['labs']))
    expect(runs).toEqual([
      ['acme', false],
      ['acme:load', false],
      ['acme', true],
      ['acme:load', true],
      ['labs', false],
      ['labs:load', false],
      ['labs', true],
      ['labs:load', true],
    ])
    expect(load).toHaveBeenCalledTimes(4)
  })

  it('nothing runs again while nothing is dropped', async () => {
    const effect = vi.fn()
    const Page: React.FC<{ n: number }> = () => (useReadEffect(effect, ['same']), null)
    const { root } = await mount(<Page n={1} />)
    await act(async () => root.render(<Page n={2} />))
    await act(async () => forgetAccountCaches([]))
    expect(effect).toHaveBeenCalledTimes(1)
  })
})

/* THE GUARD. An effect or a callback, in a page, a part or a hook, that reads — into the component's own state, or
   by asking a model to — has to be written with useReadEffect or useReadCallback, or it keeps what the sign-in before
   was shown when another comes to serve the account. This looks through the source for one written with useEffect or
   useCallback instead. One that reads nothing of an account is named below with why. */
describe('every effect and callback that reads', () => {
  // By path under src: '/pages/TagsPage.tsx'.
  const sources = Object.fromEntries(
    Object.entries(
      import.meta.glob('../{components,pages,hooks,buttons}/**/*.{ts,tsx}', {
        query: '?raw',
        import: 'default',
        eager: true,
      }) as Record<string, string>
    ).map(([path, source]) => [path.startsWith('./') ? `/hooks${path.slice(1)}` : path.replace(/^\.\./, ''), source])
  )

  const HOOK = /\buse(Effect|Callback)\(\s*(?:async )?\(?[^)]*\)?\s*=>\s*([\s\S]*?)\n?\s*,\s*\[([^\]]*)\]\s*\)/g
  const READS = /\b(graphQL\w+|fetch\w+|read\w*|request\w+|load\w*)\(|\b\w+\.(fetch\w*)\(/g
  // Named like a read, and not one: a change (the caller's own doing, made once), or not a request at all.
  const NOT_A_READ =
    /^(readOnly|readonly|loaded|loading|requestAnimationFrame|graphQL(Set|Add|Remove|Create|Delete|Update|Rename|Share|Unshare|Move|Leave|Claim|Transfer|Start|Cancel|Verify|Disable|Restore|Keep|Make|Open|Close|Rotate|Revoke)\w*)$/
  const NO_ACCOUNT: [string, string][] = [
    ['/pages/Admin', 'the operator’s own tools: remote.it’s data, asked as the page’s own person'],
    ['/components/thisDevice/', 'this machine’s, asked of its shell'],
    ['/components/AnnouncementDialog.tsx', 'marks announcements read'],
    ['/components/Avatar/Avatar.tsx', 'loads pictures'],
    ['/components/ConnectionErrorMessage/', 'a device read once more after its connection failed'],
    ['/components/Invoices.tsx', 'the page’s own person’s billing'],
    ['/components/MFA/FactorSettings.tsx', 'the page’s own person’s sign-in factors'],
    ['/components/OnboardWifi.tsx', 'the machine’s networks, asked of its backend'],
    ['/components/ProductNotificationsSetting.tsx', 'the page’s own person’s setting'],
    ['/components/SshHandleSetting.tsx', 'the page’s own person’s handle'],
    ['/hooks/useAccountStore.ts', 'dropped and read again by itself (services/accountCaches)'],
    ['/hooks/useDeviceNetworks.ts', 'dropped and read again by itself (services/accountCaches)'],
    ['/hooks/useChatSync.ts', 'the page’s own person’s conversations'],
    ['/hooks/useSafeArea.ts', 'the screen’s insets'],
    ['/hooks/useReadAgain.ts', 'these hooks themselves'],
    ['/pages/EndpointSignInPage.tsx', 'a sign-in to an endpoint, made once'],
    [
      '/pages/PartnerStatsPage/PartnerStatsListPage.tsx',
      'read by the model when the account’s data is (accounts.select)',
    ],
    ['/pages/ProductsPage/ProductAddPage.tsx', 'every platform there is, no account’s'],
  ]
  const NO_ACCOUNT_CALLS = ['fetchAll'] // applicationTypes.fetchAll: every type there is, no account's

  it('is written to read again', () => {
    const missed: string[] = []
    let looked = 0
    for (const [file, source] of Object.entries(sources)) {
      if (file.includes('.test.') || NO_ACCOUNT.some(([prefix]) => file.startsWith(prefix))) continue
      for (const hook of source.matchAll(HOOK)) {
        const body = hook[2]
        if (body.length > 3000) continue
        const reads = [...body.matchAll(READS)]
          .map(call => call[1] || call[2])
          .filter(name => !NOT_A_READ.test(name) && !NO_ACCOUNT_CALLS.includes(name))
        looked++
        if (!reads.length) continue
        const line = source.slice(0, hook.index).split('\n').length
        missed.push(`${file}:${line} use${hook[1]} calls ${[...new Set(reads)].join(', ')}`)
      }
    }
    // It did look: the pattern still finds the hooks it is there to judge.
    expect(looked).toBeGreaterThan(100)
    expect(missed, 'written with useEffect or useCallback: use useReadEffect or useReadCallback').toEqual([])
  })

  it('names nothing that is no longer there', () => {
    const files = Object.keys(sources)
    NO_ACCOUNT.forEach(([prefix]) =>
      expect(
        files.some(file => file.startsWith(prefix)),
        prefix
      ).toBe(true)
    )
  })
})
