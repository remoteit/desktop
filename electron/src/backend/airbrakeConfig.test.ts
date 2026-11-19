// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withAirbrake } = require('../../scripts/airbrake')

const BASE = { productName: 'Remote.It', extraMetadata: { name: 'remoteit' } }

describe('withAirbrake', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}))
  afterEach(() => jest.restoreAllMocks())

  test('packages the project into package.json', () => {
    expect(withAirbrake(BASE, { AIRBRAKE_PROJECT_ID: '123', AIRBRAKE_PROJECT_KEY: 'abc' })).toEqual({
      productName: 'Remote.It',
      extraMetadata: { name: 'remoteit', airbrake: { projectId: 123, projectKey: 'abc' } },
    })
  })

  test('leaves the config alone without both values', () => {
    expect(withAirbrake(BASE, {})).toBe(BASE)
    expect(withAirbrake(BASE, { AIRBRAKE_PROJECT_KEY: 'abc' })).toBe(BASE)
    expect(withAirbrake(BASE, { AIRBRAKE_PROJECT_ID: '...', AIRBRAKE_PROJECT_KEY: '...' })).toBe(BASE)
    expect(console.warn).toHaveBeenCalledTimes(3)
  })
})

describe('AirBrake', () => {
  const PACKAGED = { version: '4.0.0', airbrake: { projectId: 123, projectKey: 'abc' } }

  const load = (packageJson: object, ENVIRONMENT = 'production') => {
    jest.resetModules()
    jest.unmock('./AirBrake')
    const Notifier = jest.fn(() => ({ notify: jest.fn(() => 'sent') }))
    jest.doMock('@airbrake/node', () => ({ Notifier }))
    jest.doMock('./constants', () => ({ ENVIRONMENT }))
    jest.doMock('./packageJson', () => ({ __esModule: true, default: packageJson }))
    return { AirBrake: require('./AirBrake').default, Notifier }
  }

  test('reports with the packaged key', () => {
    const { AirBrake, Notifier } = load(PACKAGED)
    expect(Notifier).toHaveBeenCalledWith(expect.objectContaining({ projectId: 123, projectKey: 'abc' }))
    expect(AirBrake.notify({ error: new Error('x') })).toBe('sent')
  })

  test('does nothing in a build without a packaged key', () => {
    const { AirBrake, Notifier } = load({ version: '4.0.0' })
    expect(Notifier).not.toHaveBeenCalled()
    expect(AirBrake.notify({ error: new Error('x') })).toBeUndefined()
  })

  test('does nothing outside production', () => {
    const { AirBrake, Notifier } = load(PACKAGED, 'development')
    expect(Notifier).not.toHaveBeenCalled()
    expect(AirBrake.notify({ error: new Error('x') })).toBeUndefined()
  })
})
