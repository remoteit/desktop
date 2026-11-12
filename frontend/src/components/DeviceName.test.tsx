import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

vi.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/devices' }) }))
vi.mock('./Icon', () => ({ Icon: ({ name }: any) => <i data-icon={name} /> }))
vi.mock('./Title', () => ({ Title: ({ children }: any) => <span>{children}</span> }))
vi.mock('./ColorChip', () => ({ ColorChip: ({ label }: any) => <b>{label}</b> }))
// The tooltip's words, beside what it wraps.
vi.mock('@mui/material', () => ({
  Tooltip: ({ title, children }: any) => <span data-tip={title}>{children}</span>,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, a: any, b?: any) =>
      (typeof a === 'string' ? a : a.defaultValue).replace(
        /{{(\w+)}}/g,
        (_: string, k: string) => b?.[k] ?? a?.[k] ?? ''
      ),
  }),
}))

import { DeviceName } from './DeviceName'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function render(element: React.ReactElement) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(element))
  return container
}

const device = (fields: Partial<IDevice> = {}) =>
  ({ id: 'LAPTOP', name: 'Laptop', license: 'LICENSED', owner: { email: 'o@example.com' }, ...fields } as IDevice)

describe('the device list’s Protect mark', () => {
  it('a shield on a device with Protect on, the exit it goes out through in its tooltip', async () => {
    const page = await render(<DeviceName device={device({ protectExit: { id: 'xoffice', name: 'Office' } })} />)
    const mark = page.querySelector('[data-protect="xoffice"]')
    expect(mark?.querySelector('[data-icon="shield"]')).not.toBeNull()
    expect(mark?.parentElement?.getAttribute('data-tip')).toBe('Protect on — going out through Office')
  })

  it('none while Protect is off, where the list did not read it, or on a service’s name', async () => {
    for (const protectExit of [null, undefined])
      expect((await render(<DeviceName device={device({ protectExit })} />)).querySelector('[data-protect]')).toBeNull()
    const service = { id: 'SVC', name: 'ssh' } as IService
    const page = await render(
      <DeviceName device={device({ protectExit: { id: 'xoffice', name: 'Office' } })} service={service} />
    )
    expect(page.querySelector('[data-protect]')).toBeNull()
  })
})
