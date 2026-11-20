import { EventEmitter } from 'events'
import Logger from './Logger'
import loadWindow from './loadWindow'

jest.mock('./Logger', () => ({ __esModule: true, default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))

const APP = 'http://127.0.0.1:29999'
const isAppUrl = (url: string) => url.startsWith(APP)

class FakeWindow extends EventEmitter {
  destroyed = false
  webContents = Object.assign(new EventEmitter(), {
    loadURL: jest.fn((_: string) => new Promise<void>(() => undefined)),
  })
  isDestroyed() {
    return this.destroyed
  }
  commit(url = APP) {
    this.webContents.emit('did-navigate', {}, url)
  }
  fail(errorCode = -102, isMainFrame = true, url = APP) {
    this.webContents.emit('did-fail-load', {}, errorCode, 'ERR_CONNECTION_REFUSED', url, isMainFrame)
  }
}

const loads = (window: FakeWindow) => window.webContents.loadURL.mock.calls.map(([url]) => url)

describe('loadWindow', () => {
  let window: FakeWindow
  const start = (options = {}) =>
    loadWindow(window, APP, isAppUrl, { stallTimeoutMs: 10_000, retryDelayMs: 1_000, maxAttempts: 3, ...options })

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    window = new FakeWindow()
  })

  afterEach(() => jest.useRealTimers())

  it('loads once the server is listening, and only once when the page commits', async () => {
    let listen!: () => void
    start({ ready: new Promise<void>(resolve => (listen = resolve)) })
    await jest.advanceTimersByTimeAsync(5_000)
    expect(loads(window)).toEqual([])

    listen()
    await jest.advanceTimersByTimeAsync(0)
    expect(loads(window)).toEqual([APP])

    window.commit()
    await jest.advanceTimersByTimeAsync(60_000)
    expect(loads(window)).toEqual([APP])
    expect(Logger.warn).not.toHaveBeenCalled()
  })

  it('loads again when a load neither commits nor fails in time', async () => {
    start()
    await jest.advanceTimersByTimeAsync(9_999)
    expect(loads(window)).toHaveLength(1)

    await jest.advanceTimersByTimeAsync(1)
    expect(loads(window)).toEqual([APP, APP])
    expect(Logger.warn).toHaveBeenCalledWith('WINDOW LOAD RETRY', expect.objectContaining({ reason: 'stalled' }))

    window.commit()
    expect(Logger.info).toHaveBeenCalledWith('WINDOW LOADED', { attempts: 2 })
  })

  it('loads again shortly after a load fails', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    window.fail()
    await jest.advanceTimersByTimeAsync(1_000)
    expect(loads(window)).toEqual([APP, APP])
    expect(Logger.warn).toHaveBeenCalledWith(
      'WINDOW LOAD RETRY',
      expect.objectContaining({ reason: 'failed', errorCode: -102 })
    )
  })

  it('takes neither an aborted load nor a frame failure for a failed page', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    window.fail(-3)
    window.fail(-102, false)
    await jest.advanceTimersByTimeAsync(9_999)
    expect(loads(window)).toHaveLength(1)
  })

  it('gives up after the last attempt', async () => {
    start()
    await jest.advanceTimersByTimeAsync(30_000)
    expect(loads(window)).toHaveLength(3)
    expect(Logger.error).toHaveBeenCalledWith('WINDOW LOAD GAVE UP', expect.objectContaining({ attempts: 3 }))
    await jest.advanceTimersByTimeAsync(60_000)
    expect(loads(window)).toHaveLength(3)
  })

  it('loads anyway, and says so, when the server never reports listening', async () => {
    start({ ready: new Promise<void>(() => undefined), readyTimeoutMs: 15_000 })
    await jest.advanceTimersByTimeAsync(15_000)
    expect(loads(window)).toEqual([APP])
    expect(Logger.warn).toHaveBeenCalledWith('WINDOW LOAD WITHOUT SERVER', { waitedMs: 15_000 })
  })

  it('stops when the window closes', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    window.destroyed = true
    window.emit('closed')
    await jest.advanceTimersByTimeAsync(60_000)
    expect(loads(window)).toHaveLength(1)
  })

  describe('navigate', () => {
    const callback = `${APP}?code=secret-code&state=s1`

    it('before the first load, makes it load the new url', async () => {
      let listen!: () => void
      const loader = start({ ready: new Promise<void>(resolve => (listen = resolve)) })
      loader.navigate(callback)
      listen()
      await jest.advanceTimersByTimeAsync(0)
      expect(loads(window)).toEqual([callback])
    })

    it('while a load is pending, replaces it, and retries keep the new url', async () => {
      const loader = start()
      await jest.advanceTimersByTimeAsync(0)
      loader.navigate(callback)
      expect(loads(window)).toEqual([APP, callback])

      window.fail(-102, true, callback)
      await jest.advanceTimersByTimeAsync(1_000)
      expect(loads(window)).toEqual([APP, callback, callback])
      expect(JSON.stringify((Logger.warn as jest.Mock).mock.calls)).not.toContain('secret-code')
    })

    it('after the page commits, just loads the url', async () => {
      const loader = start()
      await jest.advanceTimersByTimeAsync(0)
      window.commit()
      loader.navigate(callback)
      await jest.advanceTimersByTimeAsync(60_000)
      expect(loads(window)).toEqual([APP, callback])
      expect(Logger.warn).not.toHaveBeenCalled()
    })
  })
})
