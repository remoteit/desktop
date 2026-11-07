import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The Usage tab of Admin → Proxies & exits: the month's totals, each account's exit and proxy transfer against its
// allowance with its status, the month, search, over-only and sort passed to graphql, a page more on Load more, what
// each exit carried — and a read that fails saying so in its own section.
const { usage, exits } = vi.hoisted(() => ({ usage: vi.fn(), exits: vi.fn() }))
vi.mock('../services/adminTransferUsage', () => ({ fetchAdminTransferUsage: usage, fetchAdminExitTransfer: exits }))
vi.mock('../services/transferUsage', () => ({ fetchTransferUsage: vi.fn(), UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../helpers/dateHelper', () => ({ getLocale: () => 'en-US' }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div>loading</div> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))

import { AdminTransferUsage, SEARCH_DELAY, kindStatus } from './AdminTransferUsage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const kind = (k: string, fields = {}) => ({
  kind: k,
  month: '2026-11',
  usedBytes: 1e9,
  allowanceBytes: 10e9,
  rateBps: 1e6,
  over: false,
  resetsAt: '2026-12-01T00:00:00.000Z',
  ...fields,
})

const account = (accountId: string, email: string | null, exit = {}, proxy = {}) => ({
  accountId,
  email,
  exit: kind('exit', exit),
  proxy: kind('proxy', proxy),
})

const OVER = account('A1', 'over@example.com', { usedBytes: 12e9, over: true, rateBps: 2e6 })
const NEAR = account('A2', 'near@example.com', {}, { usedBytes: 8e9 })
const OK = account('A3', null, { allowanceBytes: null, usedBytes: 3.25e9 })

const PAGE = {
  month: '2026-11',
  months: ['2026-11', '2026-10'],
  totals: { exitBytes: 42.5e9, proxyBytes: 7e9, exitAccounts: 12, proxyAccounts: 1 },
  accounts: [OVER, NEAR, OK],
  next: 'CURSOR-1',
}

const EXITS = [
  { deviceId: 'X1', name: 'edge-1', bytes: 2e9, accounts: 3 },
  { deviceId: 'X2', name: null, bytes: 30e9, accounts: 9 },
]

const flush = () => act(async () => {})

async function render() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () =>
    createRoot(container).render(
      <MemoryRouter>
        <AdminTransferUsage />
      </MemoryRouter>
    )
  )
  return container
}

const rows = (c: HTMLElement) => [...c.querySelectorAll('[data-account]')].map(r => r.getAttribute('data-account'))
const row = (c: HTMLElement, id: string) => c.querySelector<HTMLElement>(`[data-account="${id}"]`)!

// Opens an MUI select and picks the option that reads `label`.
async function choose(c: HTMLElement, choice: string, label: string) {
  const select = c
    .querySelector(`[data-choice="${choice}"]`)!
    .closest('.MuiFormControl-root')!
    .querySelector('[role="combobox"], [role="button"]')!
  await act(async () => select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })))
  const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(o => o.textContent === label)!
  await act(async () => option.click())
  await flush()
}

describe('kindStatus', () => {
  it('is slowed when over, near at 80% of the allowance, else ok', () => {
    expect(kindStatus(kind('exit', { over: true, rateBps: 2e6 }))).toEqual({
      level: 'over',
      text: 'Slowed to 2 Mbit/s',
    })
    expect(kindStatus(kind('exit', { over: true, rateBps: null })).text).toBe('Slowed')
    expect(kindStatus(kind('exit', { usedBytes: 8e9 })).level).toBe('near')
    expect(kindStatus(kind('exit', { usedBytes: 7.99e9 })).level).toBe('ok')
    expect(kindStatus(kind('exit', { usedBytes: 1e15, allowanceBytes: null })).level).toBe('ok')
  })
})

describe('AdminTransferUsage', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    usage.mockReset()
    exits.mockReset()
    usage.mockResolvedValue(PAGE)
    exits.mockResolvedValue(EXITS)
  })

  it("shows the month's totals", async () => {
    const c = await render()
    const exit = c.querySelector('[data-total="exit"]')!.textContent
    const proxy = c.querySelector('[data-total="proxy"]')!.textContent
    expect(exit).toContain('Public exit, November 2026')
    expect(exit).toContain('42.5 GB')
    expect(exit).toContain('12 accounts')
    expect(proxy).toContain('7 GB')
    expect(proxy).toContain('1 account')
    expect(usage).toHaveBeenCalledWith({ month: undefined, search: undefined, overOnly: undefined, sort: 'total' })
  })

  it("lists each account's usage and status, linked to its admin page", async () => {
    const c = await render()
    expect(rows(c)).toEqual(['A1', 'A2', 'A3'])

    expect(row(c, 'A1').querySelector('a')!.getAttribute('href')).toBe('/admin/users/A1')
    expect(row(c, 'A1').querySelector('a')!.textContent).toBe('over@example.com')
    expect(row(c, 'A1').querySelector('[data-used="exit"]')!.textContent).toBe('12 of 10 GB')
    expect(row(c, 'A1').querySelector('[data-status]')!.getAttribute('data-status')).toBe('over')
    expect(row(c, 'A1').querySelector('[data-status]')!.textContent).toBe('Slowed to 2 Mbit/s exit')

    expect(row(c, 'A2').querySelector('[data-used="proxy"]')!.textContent).toBe('8 of 10 GB')
    expect(row(c, 'A2').querySelector('[data-status]')!.textContent).toBe('Near limit proxy')

    // No email: the account ID; no allowance: never near.
    expect(row(c, 'A3').querySelector('a')!.textContent).toBe('A3')
    expect(row(c, 'A3').querySelector('[data-used="exit"]')!.textContent).toBe('3.25 GB, no limit')
    expect(row(c, 'A3').querySelector('[data-status]')!.textContent).toBe('ok')
  })

  it('asks for the over-allowance accounts alone when toggled', async () => {
    const c = await render()
    usage.mockResolvedValue({ ...PAGE, accounts: [OVER], next: null })
    await act(async () => c.querySelector<HTMLElement>('[data-choice="over-only"]')!.click())
    await flush()
    expect(usage).toHaveBeenLastCalledWith(expect.objectContaining({ overOnly: true, after: undefined }))
    expect(rows(c)).toEqual(['A1'])
    expect(c.textContent).not.toContain('Load more')
  })

  it('asks for the sort chosen', async () => {
    const c = await render()
    usage.mockResolvedValue({ ...PAGE, accounts: [NEAR, OVER] })
    await choose(c, 'sort', 'Proxy')
    expect(usage).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'proxy' }))
    expect(rows(c)).toEqual(['A2', 'A1'])
  })

  it('reads the month chosen, the per-exit table too', async () => {
    const c = await render()
    await choose(c, 'month', 'October 2026')
    expect(usage).toHaveBeenLastCalledWith(expect.objectContaining({ month: '2026-10' }))
    expect(exits).toHaveBeenLastCalledWith('2026-10')
  })

  it('searches once typing pauses', async () => {
    const c = await render()
    const input = c.querySelector<HTMLInputElement>('[data-choice="search"]')!
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    await act(async () => {
      setValue.call(input, ' near ')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(usage).toHaveBeenCalledTimes(1)
    await act(() => new Promise(resolve => setTimeout(resolve, SEARCH_DELAY + 50)))
    await flush()
    expect(usage).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'near' }))
  })

  it('appends the next page on Load more, and stops when there is none', async () => {
    const c = await render()
    usage.mockResolvedValue({ ...PAGE, accounts: [account('A4', 'four@example.com')], next: null })
    const more = [...c.querySelectorAll('button')].find(b => b.textContent === 'Load more')!
    await act(async () => more.click())
    await flush()
    expect(usage).toHaveBeenLastCalledWith(expect.objectContaining({ after: 'CURSOR-1' }))
    expect(rows(c)).toEqual(['A1', 'A2', 'A3', 'A4'])
    expect(c.textContent).not.toContain('Load more')
  })

  it('keeps the rows when a page more fails, and says so', async () => {
    const c = await render()
    usage.mockResolvedValue('ERROR')
    const more = [...c.querySelectorAll('button')].find(b => b.textContent === 'Load more')!
    await act(async () => more.click())
    await flush()
    expect(rows(c)).toEqual(['A1', 'A2', 'A3'])
    expect(c.querySelector('[data-testid="more-error"]')).not.toBeNull()
  })

  it('lists what each exit carried, the most first', async () => {
    const c = await render()
    const exitRows = [...c.querySelectorAll('[data-exit]')].map(r =>
      [...r.querySelectorAll('td')].map(td => td.textContent)
    )
    expect(exitRows).toEqual([
      ['X2', '30 GB', '9'],
      ['edge-1', '2 GB', '3'],
    ])
  })

  it('says quietly where a read failed, and the other section still shows', async () => {
    usage.mockResolvedValue('ERROR')
    let c = await render()
    expect(c.querySelector('[data-testid="usage-error"]')).not.toBeNull()
    expect(c.querySelectorAll('[data-exit]').length).toBe(2)

    document.body.innerHTML = ''
    usage.mockResolvedValue(PAGE)
    exits.mockRejectedValue(new Error('network'))
    c = await render()
    expect(c.querySelector('[data-testid="exits-error"]')).not.toBeNull()
    expect(rows(c)).toEqual(['A1', 'A2', 'A3'])
  })
})
