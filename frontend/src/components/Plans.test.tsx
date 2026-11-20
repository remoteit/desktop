import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_: string, label: string) => label }) }))
vi.mock('react-redux', () => ({
  useSelector: selector => selector({ organization: { initialized: true }, plans: {} }),
  useDispatch: () => ({}),
}))
vi.mock('react-router-dom', () => ({
  useHistory: () => ({}),
  useLocation: () => ({ pathname: '/organization/licensing' }),
}))
vi.mock('../models/plans', () => ({
  PERSONAL_PLAN_ID: 'personal',
  planDetails: { personal: {}, paid: {} },
  deviceUserTotal: () => ({}),
}))
vi.mock('../helpers/utilHelper', () => ({}))
vi.mock('./Notice', () => ({ Notice: () => null }))
vi.mock('./NoticeCustomPlan', () => ({ NoticeCustomPlan: () => null }))
vi.mock('./Confirm', () => ({ Confirm: () => null }))
vi.mock('./LoadingMessage', () => ({ LoadingMessage: () => null }))
vi.mock('./Overlay', () => ({ Overlay: ({ children }) => children }))
vi.mock('./PlanGutters', () => ({ PlanGutters: ({ children }) => children }))
vi.mock('./PlanCard', () => ({ PlanCard: ({ name, onSelect }) => <button onClick={onSelect}>{name}</button> }))
vi.mock('./PlanCheckout', () => ({
  PlanCheckout: ({ form }) => <div data-license={form.licenseId}>Checkout</div>,
}))

import { Plans } from './Plans'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('Plans', () => {
  it('discards an open checkout and uses the new license after switching organizations', async () => {
    const host = document.createElement('div')
    const root = createRoot(host)
    const plan = { id: 'paid', description: 'Paid' } as IPlan
    const render = (id: string) =>
      act(() => root.render(<Plans license={{ id, plan } as ILicense} plan={plan} plans={[plan]} includeLicenseId />))
    const choose = () => act(() => host.querySelector('button')?.click())
    const checkout = () => host.querySelector('[data-license]')

    try {
      await render('license-a')
      await choose()
      expect(checkout()?.getAttribute('data-license')).toBe('license-a')

      await render('license-b')
      expect(checkout()).toBeNull()
      await choose()
      expect(checkout()?.getAttribute('data-license')).toBe('license-b')
    } finally {
      await act(() => root.unmount())
    }
  })
})
