import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/graphQLExits', () => ({}))
vi.mock('../services/graphQL', () => ({ refusalOf: vi.fn() }))
vi.mock('./TransferUsage', () => ({ TransferUsageHintText: () => null, useTransferUsageHint: () => null }))
vi.mock('./ListItemSetting', () => ({ ListItemSetting: () => null }))
vi.mock('./SelectSetting', () => ({ SelectSetting: () => null }))
vi.mock('./Notice', () => ({ Notice: () => null }))

import { choiceName, chosenLine, policyLine } from './DeviceExitSection'
import type { DeviceExit } from '../services/graphQLExits'

const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any
const chooser = (fields: Partial<DeviceExit> = {}): DeviceExit => ({
  usesExit: null,
  usesExitThrough: null,
  exitDormant: false,
  exitSetOnDevice: null,
  exitSetOnDeviceBy: null,
  exitSetBy: null,
  exitPolicy: 'cloud+local',
  exitAllowed: null,
  exitPinned: null,
  ...fields,
})

describe('an exit offered for a device, named', () => {
  const mine = new Set(['xha', 'xshared'])
  const pat = { id: 'PAT', email: 'pat@example.com' }

  it('remote.it’s and the account’s own by name; another account’s by whose; one its networks give it, so', () => {
    expect(choiceName(t, { id: 'pdx1a', name: 'remote.it pdx1a', remoteit: true, owner: null }, 'ME', mine)).toBe(
      'remote.it pdx1a'
    )
    expect(choiceName(t, { id: 'xha', name: 'HA Derby', remoteit: false, owner: { id: 'ME', email: 'me@x' } }, 'ME', mine)).toBe(
      'HA Derby'
    )
    expect(choiceName(t, { id: 'xshared', name: 'Office', remoteit: false, owner: pat }, 'ME', mine)).toBe(
      'Office · pat@example.com’s'
    )
    expect(choiceName(t, { id: 'xnet', name: 'Router', remoteit: false, owner: pat }, 'ME', mine)).toBe(
      'Router · by its network'
    )
  })
})

describe('who chose the exit, and what the machine’s administrator decided', () => {
  it('chosen on the device, by its OS user where it said, or in the portal by a person', () => {
    expect(chosenLine(t, chooser({ exitSetOnDevice: true, exitSetOnDeviceBy: 'bob' }))).toBe('Set on the device by bob')
    expect(chosenLine(t, chooser({ exitSetOnDevice: true }))).toBe('Set on the device')
    expect(chosenLine(t, chooser({ exitSetOnDevice: false, exitSetBy: { email: 'pat@example.com' } }))).toBe(
      'Set by pat@example.com'
    )
    expect(chosenLine(t, chooser())).toBeNull()
    expect(chosenLine(t, null)).toBeNull()
  })

  it('no exit, a local choice, a pinned exit, or only some exits; nothing to say under the default', () => {
    expect(policyLine(t, chooser())).toBeNull()
    expect(policyLine(t, chooser({ exitPolicy: 'local' }))?.label).toBe('This machine’s administrator keeps its exit local')
    expect(policyLine(t, chooser({ exitPolicy: 'never' }))?.label).toBe('This machine’s administrator allows it no exit')
    expect(policyLine(t, chooser({ exitPinned: 'pdx1a' }))?.label).toBe(
      'Pinned by this machine’s administrator to pdx1a'
    )
    expect(policyLine(t, chooser({ exitAllowed: ['pdx1a', 'xha'] }))).toEqual({
      label: 'This machine’s administrator allows only some exits',
      hint: 'pdx1a, xha',
    })
    expect(policyLine(t, chooser({ exitAllowed: [] }))?.hint).toBe('None is allowed')
  })
})
