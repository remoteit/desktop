import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('../services/browser', () => ({ default: {}, setLocalStorage: vi.fn(), getOs: vi.fn() }))
vi.mock('../i18n', () => ({ default: {} }))

import backendModel from './backend'
import { emit } from '../services/Controller'

describe('backend — setPreferences', () => {
  beforeEach(() => vi.mocked(emit).mockClear())

  const receive = async (preferences: IPreferences) => {
    const dispatch = { backend: { set: vi.fn() } }
    await (backendModel as any).effects(dispatch).setPreferences(preferences)
    return dispatch.backend.set
  }

  it('clears a saved shared-domain override, which the CLI service install reads', async () => {
    const preferences = { switchApi: true, apiGraphqlURL: 'https://api.remote.it/graphql/beta' } as IPreferences
    expect(await receive(preferences)).toHaveBeenCalledWith({ preferences })
    expect(emit).toHaveBeenCalledWith('preferences', { switchApi: false, apiGraphqlURL: '' })
  })

  it('leaves any other target alone', async () => {
    await receive({ switchApi: true, apiGraphqlURL: 'https://cloud.dev.remote.it/api/graphql' } as IPreferences)
    await receive({ switchApi: false, apiGraphqlURL: '' } as IPreferences)
    expect(emit).not.toHaveBeenCalled()
  })
})
