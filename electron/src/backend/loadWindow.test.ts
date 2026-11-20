import { EventEmitter } from 'events'
import type { BrowserWindow } from 'electron'
import AirBrake from './AirBrake'
import Logger from './Logger'
import loadWindow from './loadWindow'

jest.mock('./Logger', () => ({ __esModule: true, default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))
jest.mock('./AirBrake', () => ({ __esModule: true, default: { notify: jest.fn() } }))
jest.mock('./environment', () => ({ __esModule: true, default: { version: '4.0.4' } }))

const APP = 'http://127.0.0.1:29999/'

class FakeWindow {
  destroyed = false
  loading = true
  webContents = Object.assign(new EventEmitter(), {
    loadURL: jest.fn((_: string) => new Promise<void>(() => undefined)),
    getURL: () => 'about:blank',
    isLoading: () => this.loading,
    isWaitingForResponse: () => false,
    getOSProcessId: () => 4242,
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
  stop() {
    this.loading = false
    this.webContents.emit('did-stop-loading')
  }
}

const loads = (window: FakeWindow) => window.webContents.loadURL.mock.calls.map(([url]) => url)

describe('loadWindow', () => {
  let window: FakeWindow
  const start = (ready: Promise<void> = Promise.resolve()) => loadWindow(window as unknown as BrowserWindow, APP, ready)

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    window = new FakeWindow()
  })

  afterEach(() => jest.useRealTimers())

  it('loads once the server is listening, and only once when the page commits', async () => {
    let listen!: () => void
    start(new Promise<void>(resolve => (listen = resolve)))
    await jest.advanceTimersByTimeAsync(5_000)
    expect(loads(window)).toEqual([])

    listen()
    await jest.advanceTimersByTimeAsync(0)
    expect(loads(window)).toEqual([APP])

    window.commit(`${APP}#/devices`)
    await jest.advanceTimersByTimeAsync(60_000)
    expect(loads(window)).toEqual([APP])
    expect(Logger.warn).not.toHaveBeenCalled()
  })

  it('loads again when a load neither commits nor fails in time, saying how far it got', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    window.webContents.emit('did-start-loading')
    await jest.advanceTimersByTimeAsync(9_999)
    expect(loads(window)).toHaveLength(1)

    await jest.advanceTimersByTimeAsync(1)
    expect(loads(window)).toEqual([APP, APP])
    expect(Logger.warn).toHaveBeenCalledWith('WINDOW LOAD RETRY', {
      attempt: 2,
      reason: 'stalled',
      elapsedMs: 10_000,
      startedLoading: true,
      page: 'about:blank',
      loading: true,
      waitingForResponse: false,
      rendererPid: 4242,
    })

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

  it('loads again shortly after a load stops without the app or an error', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    window.webContents.emit('did-start-loading')
    window.stop()
    await jest.advanceTimersByTimeAsync(999)
    expect(loads(window)).toHaveLength(1)

    await jest.advanceTimersByTimeAsync(1)
    expect(loads(window)).toEqual([APP, APP])
    expect(Logger.warn).toHaveBeenCalledWith('WINDOW LOAD RETRY', { attempt: 2, reason: 'stopped' })
  })

  it('loads again once an aborted load stops, saying it was aborted', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    window.fail(-3)
    window.stop()
    await jest.advanceTimersByTimeAsync(1_000)
    expect(loads(window)).toEqual([APP, APP])
    expect(Logger.warn).toHaveBeenCalledWith(
      'WINDOW LOAD RETRY',
      expect.objectContaining({ attempt: 2, reason: 'failed', errorCode: -3 })
    )
  })

  it('waits twice as long before each retry of a load that keeps stopping, then gives up', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    const stopAndWait = async (ms: number) => {
      window.stop()
      window.loading = true
      await jest.advanceTimersByTimeAsync(ms - 1)
    }
    for (const [ms, count] of [
      [1_000, 2],
      [2_000, 3],
      [4_000, 4],
      [8_000, 5],
    ]) {
      await stopAndWait(ms)
      window.loading = false
      expect(loads(window)).toHaveLength(count - 1)
      await jest.advanceTimersByTimeAsync(1)
      expect(loads(window)).toHaveLength(count)
    }
    window.stop()
    await jest.advanceTimersByTimeAsync(60_000)
    expect(loads(window)).toHaveLength(5)
    expect(AirBrake.notify).toHaveBeenCalledTimes(1)
  })

  it('loads once for a failure that is followed by its stop', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    window.fail()
    window.stop()
    await jest.advanceTimersByTimeAsync(5_000)
    expect(loads(window)).toEqual([APP, APP])
  })

  it('waits for a load that starts after one stops, and retries it only when it stalls', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    window.stop()
    window.loading = true
    await jest.advanceTimersByTimeAsync(10_999)
    expect(loads(window)).toHaveLength(1)

    await jest.advanceTimersByTimeAsync(1)
    expect(loads(window)).toHaveLength(2)
    expect(Logger.warn).toHaveBeenCalledWith('WINDOW LOAD RETRY', expect.objectContaining({ reason: 'stalled' }))
  })

  it('loads nothing for a stop before the server listens', async () => {
    start(new Promise<void>(() => undefined))
    window.stop()
    await jest.advanceTimersByTimeAsync(5_000)
    expect(loads(window)).toEqual([])
  })

  it('takes neither an aborted load nor a frame failure for a failed page', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    window.fail(-3)
    window.fail(-102, false)
    await jest.advanceTimersByTimeAsync(9_999)
    expect(loads(window)).toHaveLength(1)
  })

  it('takes a page of another origin for no load of the app', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    window.commit('http://127.0.0.1:2999/')
    await jest.advanceTimersByTimeAsync(10_000)
    expect(loads(window)).toHaveLength(2)
  })

  it('gives up after the last attempt, and reports it', async () => {
    start()
    await jest.advanceTimersByTimeAsync(50_000)
    expect(loads(window)).toHaveLength(5)
    expect(Logger.error).toHaveBeenCalledWith('WINDOW LOAD GAVE UP', expect.objectContaining({ attempts: 5 }))
    expect(AirBrake.notify).toHaveBeenCalledTimes(1)
    expect(AirBrake.notify).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ type: 'WINDOW LOAD GAVE UP', reason: 'stalled' }) })
    )
    await jest.advanceTimersByTimeAsync(60_000)
    expect(loads(window)).toHaveLength(5)
  })

  it('loads anyway, and says so, when the server never reports listening', async () => {
    start(new Promise<void>(() => undefined))
    await jest.advanceTimersByTimeAsync(15_000)
    expect(loads(window)).toEqual([APP])
    expect(Logger.warn).toHaveBeenCalledWith('WINDOW LOAD WITHOUT SERVER', { waitedMs: 15_000 })
  })

  it('stops once the window is gone', async () => {
    start()
    await jest.advanceTimersByTimeAsync(0)
    window.fail()
    window.destroyed = true
    await jest.advanceTimersByTimeAsync(60_000)
    expect(loads(window)).toHaveLength(1)
  })

  it('says when the app has loaded, for what must wait for it', async () => {
    const loader = start()
    const loaded = jest.fn()
    void loader.loaded.then(loaded)
    await jest.advanceTimersByTimeAsync(0)
    window.commit('about:blank')
    await jest.advanceTimersByTimeAsync(0)
    expect(loaded).not.toHaveBeenCalled()

    window.commit()
    await jest.advanceTimersByTimeAsync(0)
    expect(loaded).toHaveBeenCalled()
  })

  describe('navigate', () => {
    const callback = `${APP}?code=secret-code&state=s1`

    it('before the first load, makes it load the new url', async () => {
      let listen!: () => void
      const loader = start(new Promise<void>(resolve => (listen = resolve)))
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
      await jest.advanceTimersByTimeAsync(2_000)
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
