import { describe, it, expect } from 'vitest'
import type { TFunction } from 'i18next'
import { recommendedChoices } from '../helpers/addChoices'

const t = ((_key: string, text: string) => text) as unknown as TFunction
const visitor = { os: 'mac' as const, app: false, registered: false, devicePackage: true, empty: true }

describe('the Add page’s recommended choices', () => {
  it('this computer first, then a Linux device and Docker, and the demo device for an empty account', () => {
    const choices = recommendedChoices(visitor, t)
    expect(choices.map(c => [c.id, c.title, c.to])).toEqual([
      ['this', 'This Mac', '/add/mac?package'],
      ['linux', 'A Linux device', '/add/linux?package'],
      ['docker', 'Docker', '/add/docker?package'],
      ['demo', 'Try a demo device', undefined],
    ])
  })

  it('no demo device once the account has devices', () => {
    expect(recommendedChoices({ ...visitor, empty: false }, t).map(c => c.id)).toEqual(['this', 'linux', 'docker'])
  })

  it('on Linux, one card for this computer and other Linux devices', () => {
    const choices = recommendedChoices({ ...visitor, os: 'linux', empty: false }, t)
    expect(choices.map(c => [c.id, c.title])).toEqual([
      ['linux', 'This computer or a Linux device'],
      ['docker', 'Docker'],
    ])
  })

  it('in the desktop app: this computer’s own setup page, gone once it is a device', () => {
    expect(recommendedChoices({ ...visitor, os: 'windows', app: true }, t)[0]).toMatchObject({
      title: 'This PC',
      to: '/devices/setup',
    })
    expect(recommendedChoices({ ...visitor, app: true, registered: true }, t)[0].id).toBe('linux')
  })
})
