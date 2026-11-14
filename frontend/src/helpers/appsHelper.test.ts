import { describe, it, expect } from 'vitest'
import type { TFunction } from 'i18next'
import { stateLine, stateWord, withdrawal } from './appsHelper'

const t = ((_key: string, text: string, values?: any) =>
  text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as unknown as TFunction

// graphql's words (services/device-apps.ts): WITHDRAWN, withdrawnDisabled('1.5.0'), KEPT_WITHDRAWN.
const WITHDRAWN = 'Its release was withdrawn by its publisher: removed from the device until a new one is published'
const WITHDRAWN_DISABLED = 'Its release was withdrawn by its publisher: removed from the device; enabling installs 1.5.0 anew'
const KEPT = 'Kept by this device’s administrator, though its release was withdrawn'
const app = (state: any, detail: string | null) => ({ state, detail, root: false, awaitingRoot: null })

describe('a withdrawn release, said once', () => {
  it('graphql’s sentence alone where it cannot run — not "Not available here: Its release was withdrawn …"', () => {
    expect(stateLine(t, app('unavailable', WITHDRAWN))).toBe(WITHDRAWN)
    expect(stateWord(t, 'unavailable', WITHDRAWN)).toBe('Withdrawn')
  })

  it('disabled: graphql’s withdrawnDisabled words after Disabled', () => {
    expect(stateLine(t, app('disabled', WITHDRAWN_DISABLED))).toBe(`Disabled — ${WITHDRAWN_DISABLED}`)
    expect(stateWord(t, 'disabled', WITHDRAWN_DISABLED)).toBe('Disabled')
  })

  it('the daemon’s own words (This device reads connectd): "Withdrawn by its publisher"', () => {
    expect(stateLine(t, app('unavailable', 'withdrawn by its publisher'))).toBe('Withdrawn by its publisher')
    expect(withdrawal({ detail: 'withdrawn by its publisher' })).toBe('withdrawn')
  })

  it('kept by its administrator: graphql’s words, or the daemon’s in lower case, in the portal’s', () => {
    expect(stateLine(t, app('running', KEPT))).toBe(`Running — ${KEPT}`)
    expect(stateLine(t, app('unavailable', KEPT))).toBe(KEPT)
    expect(stateLine(t, app('disabled', 'kept by this device\'s administrator, though its release was withdrawn'))).toBe(
      `Disabled — ${KEPT}`
    )
    expect(stateWord(t, 'running', KEPT)).toBe('Running')
    expect(withdrawal({ detail: KEPT })).toBe('kept')
  })

  it('any other detail as before', () => {
    expect(withdrawal({ detail: 'No release on this stage' })).toBeUndefined()
    expect(stateLine(t, app('unavailable', 'No release on this stage'))).toBe('Not available here: No release on this stage')
    expect(stateWord(t, 'unavailable', 'No release on this stage')).toBe('Unavailable')
  })
})
