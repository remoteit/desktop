import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Making an endpoint: the proxy choice defaults to remote.it's nearest the device, which shows its name like any other
// choice and sends no proxy; a named proxy sends its id.
const { create } = vi.hoisted(() => ({ create: vi.fn(async () => ({} as any)) }))
vi.mock('../services/graphQLProxy', () => ({
  graphQLServiceEndpoints: async () => [],
  graphQLProxies: async () => [
    {
      id: 'E1',
      kind: 'remoteit',
      region: 'us-west-2',
      host: 'e1.solo.r3proxy.com',
      name: null,
      domain: null,
      publicEndpoints: true,
      manage: false,
      certificate: 'ready',
    },
  ],
  graphQLCreateEndpoint: create,
  graphQLRemoveEndpoint: vi.fn(),
  endpointAddress: () => '',
}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, onClick }: any) => (
    <button onClick={e => onClick({ ...e, stopPropagation() {} })}>{title}</button>
  ),
}))
vi.mock('../buttons/ConfirmIconButton', () => ({ ConfirmIconButton: () => null }))
vi.mock('../buttons/CopyIconButton', () => ({ CopyIconButton: () => null }))
vi.mock('./Timestamp', () => ({ Timestamp: () => null }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { EndpointsAccordion } from './EndpointsAccordion'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const NEAREST = "remote.it's, nearest the device"

async function openForm() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const device = { id: 'DEVICE', permissions: ['MANAGE'] } as any
  await act(async () => root.render(<EndpointsAccordion device={device} service={{ id: 'SERVICE' } as any} />))
  const add = [...container.querySelectorAll('button')].find(b => b.textContent === 'Add an endpoint')!
  await act(async () => add.click())
  return container
}

const proxyField = (container: HTMLElement) =>
  [...container.querySelectorAll('.MuiFormControl-root')].find(f => f.querySelector('label')?.textContent === 'Proxy')!

const makeIt = async (container: HTMLElement) => {
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === 'Make the endpoint')!
  await act(async () => button.click())
}

describe('the endpoint form’s proxy choice', () => {
  beforeEach(() => {
    create.mockClear()
    document.body.innerHTML = ''
  })

  it('shows the nearest choice by name, the label raised above it', async () => {
    const field = proxyField(await openForm())
    expect(field.querySelector('.MuiSelect-select')?.textContent).toBe(NEAREST)
    expect(field.querySelector('label')?.getAttribute('data-shrink')).toBe('true')
  })

  it('sends no proxy for the nearest choice', async () => {
    await makeIt(await openForm())
    expect(create).toHaveBeenCalledTimes(1)
    expect((create.mock.calls[0] as any[])[1].proxyId).toBeUndefined()
  })

  it('shows and sends a named proxy', async () => {
    const container = await openForm()
    const field = proxyField(container)
    await act(async () => (field.closest('.MuiListItemButton-root') as HTMLElement).click())
    const option = [...document.querySelectorAll('[role="option"]')].find(o =>
      o.textContent?.includes('e1.solo.r3proxy.com')
    ) as HTMLElement
    await act(async () => option.click())
    expect(field.querySelector('.MuiSelect-select')?.textContent).toBe('e1.solo.r3proxy.com (us-west-2)')
    await makeIt(container)
    expect((create.mock.calls[0] as any[])[1].proxyId).toBe('E1')
  })
})
