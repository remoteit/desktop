// Tests src/index.ts; it lives here because the electron jest config's rootDir is src/backend.
const launch = (gotLock: boolean) => {
  const app = { requestSingleInstanceLock: jest.fn(() => gotLock), quit: jest.fn() }
  const start = jest.fn(() => ({}))
  jest.isolateModules(() => {
    jest.doMock('electron', () => ({ app }))
    jest.doMock('../start', start)
    require('../index')
  })
  return { app, start }
}

describe('electron entry', () => {
  it('quits a second launch without loading the backend, tray or window', () => {
    const { app, start } = launch(false)
    expect(start).not.toHaveBeenCalled()
    expect(app.quit).toHaveBeenCalledTimes(1)
  })

  it('starts the app for the launch that holds the lock', () => {
    const { app, start } = launch(true)
    expect(start).toHaveBeenCalledTimes(1)
    expect(app.quit).not.toHaveBeenCalled()
  })
})
