import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { field, read, available, choose } = vi.hoisted(() => ({
  field: { props: undefined as any },
  read: vi.fn(),
  available: vi.fn(),
  choose: vi.fn(),
}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
// What subnetNames calls through; its rules are its own.
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../services/deviceSessionInfo', () => ({ refreshDeviceSessionInfo: vi.fn(), requestDeviceSessionInfo: vi.fn() }))
vi.mock('../services/subnetNames', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/subnetNames')>()),
  graphQLAccountSlug: read,
  accountSlugAvailable: available,
  setAccountSlug: choose,
}))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('./Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('./InlineTextFieldSetting', () => ({
  InlineTextFieldSetting: (props: any) => {
    field.props = props
    return <div data-value>{props.displayValue}</div>
  },
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { AccountSlugSetting } from './AccountSlugSetting'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function render(accountId?: string) {
  field.props = undefined
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<AccountSlugSetting accountId={accountId} />))
  return container
}

beforeEach(() => {
  read.mockReset().mockResolvedValue('acme')
  available.mockReset().mockResolvedValue(true)
  choose.mockReset().mockResolvedValue('acme-robotics')
})

describe('AccountSlugSetting', () => {
  it("shows the account's slug and that the old one keeps working for 30 days", async () => {
    const container = await render('ORG')
    expect(read).toHaveBeenCalledWith('ORG')
    expect(container.querySelector('[data-value]')!.textContent).toBe('acme')
    expect(container.textContent).toContain('the old slug keeps working for 30 days')
  })

  it('checks the form as typed, then whether the account can have it', async () => {
    await render('ORG')
    expect(await field.props.validate('a-')).toMatch('3 to 32')
    expect(available).not.toHaveBeenCalled()
    expect(await field.props.validate('Acme-Robotics')).toBeUndefined()
    expect(available).toHaveBeenCalledWith('acme-robotics', 'ORG')
    available.mockResolvedValue(false)
    expect(await field.props.validate('google')).toBe('google is taken or reserved')
    available.mockResolvedValue(undefined) // could not be asked: graphql decides on save
    expect(await field.props.validate('other')).toBeUndefined()
    expect(await field.props.validate('acme')).toBeUndefined() // its own
  })

  it('saves through setAccountSlug and shows what graphql chose', async () => {
    const container = await render()
    await act(async () => field.props.onSave('Acme-Robotics'))
    expect(choose).toHaveBeenCalledWith('Acme-Robotics', undefined)
    expect(container.querySelector('[data-value]')!.textContent).toBe('acme-robotics')
  })

  it('nothing where the API does not serve it', async () => {
    read.mockResolvedValue('UNSUPPORTED')
    expect((await render()).textContent).toBe('')
  })
})
