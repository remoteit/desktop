import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { served, productPolicy, deviceProduct, sessions } = vi.hoisted(() => ({
  served: vi.fn(),
  productPolicy: vi.fn(),
  deviceProduct: vi.fn(),
  sessions: { on: true },
}))
vi.mock('../services/productPolicy', () => ({
  NOTHING_SERVED: { device: false, product: false },
  productPolicyServed: served,
  graphQLProductPolicy: productPolicy,
  graphQLDeviceProduct: deviceProduct,
}))
vi.mock('./useDeviceSessions', () => ({ useDeviceSessions: () => sessions.on }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'A1' }))

import { resetProductPolicyReads, useDeviceProduct, useProductPolicy, useProductPolicyServed } from './useProductPolicy'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
const seen: Record<string, any> = {}
const Served = () => {
  seen.served = useProductPolicyServed()
  return null
}
const Product = ({ id, name }: { id: string; name: string }) => {
  const { policy, reload } = useProductPolicy(id)
  seen[name] = { policy, reload }
  return null
}
const Device = ({ device, name }: { device: any; name: string }) => {
  const { state, reload } = useDeviceProduct(device)
  seen[name] = { state, reload }
  return null
}

async function render(node: React.ReactElement) {
  const container = document.createElement('div')
  root = createRoot(container)
  await act(async () => root.render(node))
}

beforeEach(() => {
  sessions.on = true
  served.mockReset().mockResolvedValue({ device: true, product: true })
  productPolicy.mockReset().mockResolvedValue({ sync: 'synced' })
  deviceProduct.mockReset().mockResolvedValue({ product: null, origin: null, tags: [], services: [] })
  resetProductPolicyReads()
  Object.keys(seen).forEach(key => delete seen[key])
})
afterEach(() => act(() => root.unmount()))

describe('product policy’s reads', () => {
  it('with the device-sessions gate off: nothing served, nothing asked', async () => {
    sessions.on = false
    await render(
      <>
        <Served />
        <Product id="P1" name="a" />
      </>
    )
    expect(seen.served).toEqual({ device: false, product: false })
    expect(served).not.toHaveBeenCalled()
    expect(productPolicy).not.toHaveBeenCalled()
    expect(seen.a.policy).toBeNull()
  })

  it('a product read once for every part of the page that shows it, in the account in view', async () => {
    await render(
      <>
        <Product id="P1" name="a" />
        <Product id="P1" name="b" />
      </>
    )
    expect(productPolicy).toHaveBeenCalledTimes(1)
    expect(productPolicy).toHaveBeenCalledWith('P1', 'A1')
    expect(seen.a.policy).toEqual({ sync: 'synced' })
    expect(seen.b.policy).toEqual({ sync: 'synced' })
  })

  it('read again after a change, for each part; one that could not be read is null', async () => {
    await render(<Product id="P1" name="a" />)
    productPolicy.mockResolvedValue({ sync: 'enforced' })
    await act(async () => seen.a.reload())
    expect(seen.a.policy).toEqual({ sync: 'enforced' })
    productPolicy.mockResolvedValue('ERROR')
    await act(async () => seen.a.reload())
    expect(seen.a.policy).toBeNull()
  })

  it('the latest read wins: one started before a change cannot land after the one that follows it', async () => {
    let first: (value: any) => void = () => {}
    productPolicy.mockReturnValueOnce(new Promise(resolve => (first = resolve)))
    await render(<Product id="P1" name="a" />)
    productPolicy.mockResolvedValue({ sync: 'enforced' })
    await act(async () => seen.a.reload())
    await act(async () => first({ sync: 'template' }))
    expect(seen.a.policy).toEqual({ sync: 'enforced' })
  })

  it('a device’s product, in its own account; a virtual device has none', async () => {
    await render(
      <>
        <Device device={{ id: 'D1', accountId: 'A2' }} name="d" />
        <Device device={{ id: 'V1', virtual: true }} name="v" />
      </>
    )
    expect(deviceProduct).toHaveBeenCalledTimes(1)
    expect(deviceProduct).toHaveBeenCalledWith('D1', 'A2')
    expect(seen.d.state).toEqual({ product: null, origin: null, tags: [], services: [] })
    expect(seen.v.state).toBeNull()
  })

  it('nothing read where the API serves no side of it', async () => {
    served.mockResolvedValue({ device: false, product: false })
    await render(
      <>
        <Product id="P1" name="a" />
        <Device device={{ id: 'D1' }} name="d" />
      </>
    )
    expect(productPolicy).not.toHaveBeenCalled()
    expect(deviceProduct).not.toHaveBeenCalled()
  })
})
