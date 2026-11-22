import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const gates = vi.hoisted(() => ({ deviceSessions: false }))
vi.mock('../store', () => ({}))
vi.mock('@common/brand/config', () => ({ default: { name: 'remoteit' } }))
vi.mock('../services/browser', () => ({ default: {} }))
vi.mock('react-redux', () => ({ useSelector: () => false }))
vi.mock('../models/partnerStats', () => ({ getHasPartner: () => false }))
vi.mock('../selectors/products', () => ({ getProductModel: () => ({}) }))
vi.mock('../selectors/ui', () => ({ selectDefaultSelectedPage: () => ({}) }))
vi.mock('./useChatEnabled', () => ({ useChatToggle: () => ({ show: false }) }))
vi.mock('./useDeviceSessions', () => ({ useDeviceSessions: () => gates.deviceSessions }))
vi.mock('./useServiceShortcutsSupport', () => ({ useServiceShortcutsSupport: () => undefined }))
vi.mock('./useThisDevice', () => ({ useThisDevice: () => undefined, useThisDevicePage: () => false }))

import { useNavGates } from './useNavSections'
import { NavGates } from '../helpers/navSections'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function read(): Promise<NavGates> {
  let out: NavGates | undefined
  const Probe = () => {
    out = useNavGates(false)
    return null
  }
  await act(async () => createRoot(document.createElement('div')).render(<Probe />))
  return out!
}

describe('the navigation’s gates', () => {
  it('shows Public addresses wherever Exits and Proxy servers show: with device sessions', async () => {
    gates.deviceSessions = true
    expect(await read()).toMatchObject({ deviceSessions: true, publicAddresses: true })
    gates.deviceSessions = false
    expect(await read()).toMatchObject({ deviceSessions: false, publicAddresses: false })
  })
})
