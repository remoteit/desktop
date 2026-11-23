import { describe, it, expect, vi } from 'vitest'
import type { State } from '../store'

vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn() }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: vi.fn() }))

import { findType, isReverseProxy } from './applicationTypes'

const type = (id: number, name: string, proxy: boolean) => ({ id, name, proxy, port: 1, scheme: '' } as IApplicationType)
// As the portal sorts them: ScreenView, proxied, is first.
const all = [type(48, 'ScreenView (beta)', true), type(7, 'HTTP', true), type(1, 'TCP', false)]
const state = (types: IApplicationType[]) => ({ applicationTypes: { all: types } } as State)

const MINECRAFT = 41
const MINECRAFT_BEDROCK = 32771

describe('findType', () => {
  it('is the listed type', () => expect(findType(all, 7)).toBe(all[1]))

  it('is itself for a type not listed, or before the list has loaded', () => {
    expect(findType(all, MINECRAFT)).toMatchObject({ id: MINECRAFT, name: 'Minecraft', proxy: false, protocol: 'TCP' })
    expect(findType(all, MINECRAFT_BEDROCK)).toMatchObject({ id: MINECRAFT_BEDROCK, protocol: 'UDP' })
    expect(findType([], 7)).toMatchObject({ id: 7, proxy: false })
    expect(findType(undefined, 7)).toMatchObject({ id: 7 })
  })

  it('is the first listed for no type', () => expect(findType(all)).toBe(all[0]))
})

describe('isReverseProxy', () => {
  it('is what the API says of the type, and not for one it does not list, none, or before it has', () => {
    expect(isReverseProxy(state(all), 48)).toBe(true)
    expect(isReverseProxy(state(all), 1)).toBe(false)
    expect(isReverseProxy(state(all), MINECRAFT)).toBe(false)
    expect(isReverseProxy(state(all), undefined)).toBe(false)
    expect(isReverseProxy(state([]), 48)).toBe(false)
  })
})
