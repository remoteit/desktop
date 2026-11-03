import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { read } = vi.hoisted(() => ({ read: vi.fn() }))
vi.mock('../services/transferUsage', () => ({ fetchTransferUsage: read, UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../helpers/dateHelper', () => ({ getLocale: () => 'en-US' }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, text: any, values?: any) =>
        typeof text === 'string'
          ? fill(text, values)
          : fill(text.count === 1 ? text.defaultValue_one : text.defaultValue_other, text),
    }),
  }
})

import { TransferUsage, gigabytes, megabits } from './TransferUsage'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

async function render(accountId = 'ACCOUNT') {
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <TransferUsage accountId={accountId} />
      </ThemeProvider>
    )
  )
  return container
}

const resetsAt = '2026-12-01T00:00:00.000Z'
const resets = new Date(resetsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const exit = (fields = {}) => ({
  kind: 'exit',
  month: '2026-11',
  usedBytes: 3.5e9,
  allowanceBytes: 10e9,
  rateBps: 1e6,
  over: false,
  resetsAt,
  devices: [
    { deviceId: 'D1', name: 'Office Mac', usedBytes: 2e9 },
    { deviceId: 'D2', name: 'Pi', usedBytes: 0.5e9 },
    { deviceId: 'D3', name: null, usedBytes: 0.4e9 },
    { deviceId: 'D4', name: 'NAS', usedBytes: 0.35e9 },
    { deviceId: 'D5', name: 'Camera', usedBytes: 0.25e9 },
    { deviceId: 'D6', name: 'Idle', usedBytes: 0 },
  ],
  ...fields,
})

const proxy = (fields = {}) => ({
  kind: 'proxy',
  month: '2026-11',
  usedBytes: 1.25e9,
  allowanceBytes: 5e9,
  rateBps: 1e6,
  over: false,
  resetsAt,
  devices: [],
  ...fields,
})

describe('TransferUsage', () => {
  beforeEach(() => read.mockReset())

  it('shows exit and proxy against their allowances, the reset date once, and the top exit devices', async () => {
    read.mockResolvedValue([exit(), proxy()])
    const container = await render()
    expect(read).toHaveBeenCalledWith('ACCOUNT')
    const text = container.textContent
    expect(text).toContain('Usage this month')
    expect(text).toContain('Public exit transfer: 3.5 GB of 10 GB used')
    expect(text).toContain('Public proxy transfer: 1.25 GB of 5 GB used')
    expect(text!.split('Resets').length - 1).toBe(1)
    expect(text).toContain(`Resets ${resets}`)
    expect(text).not.toContain('Slowed')
    expect(container.querySelectorAll('[role="progressbar"]').length).toBe(2)

    const devices = container.querySelector('[data-testid="transfer-usage-devices"]')!.textContent
    expect(devices).toContain('Office Mac2 GB')
    expect(devices).toContain('Pi0.5 GB')
    expect(devices).toContain('D30.4 GB') // no name: its id
    expect(devices).toContain('2 other devices0.6 GB') // NAS + Camera; the idle one is left out
    expect(devices).not.toContain('NAS')
    expect(
      container.querySelector('[data-testid="transfer-usage-proxy"] [data-testid="transfer-usage-devices"]')
    ).toBeNull()
  })

  it('warns that an account over its allowance is slowed, and until when', async () => {
    read.mockResolvedValue([exit({ usedBytes: 12e9, over: true, rateBps: 2.5e6 }), proxy()])
    const container = await render()
    const row = container.querySelector('[data-testid="transfer-usage-exit"]')!
    expect(row.textContent).toContain('12 GB of 10 GB used')
    expect(row.textContent).toContain(`Slowed to 2.5 Mbit/s until ${resets}`)
    expect(container.querySelector('[data-testid="transfer-usage-proxy"]')!.textContent).not.toContain('Slowed')
  })

  it('shows what was used, and no limit, where there is no allowance', async () => {
    read.mockResolvedValue([exit({ allowanceBytes: null, devices: [] }), proxy({ allowanceBytes: null, usedBytes: 0 })])
    const container = await render()
    const text = container.textContent
    expect(text).toContain('Public exit transfer: 3.5 GB used, no limit')
    expect(text).toContain('Public proxy transfer: 0 GB used, no limit')
    expect(container.querySelectorAll('[role="progressbar"]').length).toBe(0)
    expect(container.querySelector('[data-testid="transfer-usage-devices"]')).toBeNull()
  })

  it('says so quietly where the query errors, and shows nothing where the API has no usage', async () => {
    read.mockResolvedValue('ERROR')
    let container = await render()
    expect(container.textContent).toContain('Usage could not be read right now.')
    expect(container.textContent).not.toContain('Public exit transfer')

    read.mockRejectedValue(new Error('network'))
    container = await render()
    expect(container.textContent).toContain('Usage could not be read right now.')

    read.mockResolvedValue('UNSUPPORTED')
    container = await render()
    expect(container.textContent).toBe('')

    read.mockResolvedValue([])
    container = await render()
    expect(container.textContent).toBe('')
  })

  it('formats bytes as decimal GB and rates as Mbit/s', () => {
    expect(gigabytes(0)).toBe('0 GB')
    expect(gigabytes(1e9)).toBe('1 GB')
    expect(gigabytes(123.45e9)).toBe('123.5 GB')
    expect(gigabytes(20e9)).toBe('20 GB')
    expect(megabits(1e6)).toBe('1')
    expect(megabits(512e3)).toBe('0.5')
  })
})
