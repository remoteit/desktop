import type { BrowserWindow, WebContents } from 'electron'
import AirBrake from './AirBrake'
import Logger from './Logger'
import environment from './environment'
import { withoutQuery } from './withoutQuery'

const READY_TIMEOUT_MS = 15_000
const STALL_TIMEOUT_MS = 10_000
const RETRY_DELAY_MS = 1_000
const MAX_ATTEMPTS = 5
const ERR_ABORTED = -3

type LoadableWindow = Pick<BrowserWindow, 'isDestroyed'> & {
  webContents: Pick<WebContents, 'on' | 'loadURL' | 'getURL' | 'isLoading' | 'isWaitingForResponse' | 'getOSProcessId'>
}

/** Loads `url` once `ready` (the server) resolves, and again if it fails, stops without committing, or neither
 *  commits nor fails in time: a first load sometimes stops with no page and no error after an update on Windows. */
export default function loadWindow(window: LoadableWindow, url: string, ready: Promise<void>) {
  const origin = new URL(url).origin
  let target = url
  let attempts = 0
  let startedAt = 0
  let startedLoading = false
  let committed = false
  let failure: Record<string, unknown> | undefined
  let markLoaded!: () => void
  const loaded = new Promise<void>(resolve => (markLoaded = resolve))
  let timer: ReturnType<typeof setTimeout> | undefined

  const retry = (reason: string, details: Record<string, unknown> = {}) => {
    if (attempts >= MAX_ATTEMPTS) {
      Logger.error('WINDOW LOAD GAVE UP', { attempts, reason, ...details })
      AirBrake.notify({
        params: { type: 'WINDOW LOAD GAVE UP', attempts, reason, ...details },
        context: { version: environment.version },
        error: new Error(`The app window did not load after ${attempts} attempts (${reason})`),
      })
      return
    }
    Logger.warn('WINDOW LOAD RETRY', { attempt: attempts + 1, reason, ...details })
    load()
  }

  const stalled = () => {
    if (committed || window.isDestroyed()) return
    const { webContents } = window
    retry('stalled', {
      elapsedMs: Date.now() - startedAt,
      startedLoading,
      page: withoutQuery(webContents.getURL()),
      loading: webContents.isLoading(),
      waitingForResponse: webContents.isWaitingForResponse(),
      rendererPid: webContents.getOSProcessId(),
    })
  }

  const soon = (then: () => void) => {
    clearTimeout(timer)
    const attempt = attempts
    // Doubling, so five attempts that stop at once span about 15 s instead of giving up within 5.
    const delay = RETRY_DELAY_MS * 2 ** (attempt - 1)
    timer = setTimeout(() => !committed && !window.isDestroyed() && attempt === attempts && then(), delay)
  }

  const load = () => {
    attempts++
    startedAt = Date.now()
    startedLoading = false
    failure = undefined
    clearTimeout(timer)
    timer = setTimeout(stalled, STALL_TIMEOUT_MS)
    // Failures arrive through did-fail-load.
    window.webContents.loadURL(target).catch(() => undefined)
  }

  window.webContents.on('did-start-loading', () => (startedLoading = true))

  window.webContents.on('did-navigate', (_, navigatedUrl) => {
    if (committed || new URL(navigatedUrl).origin !== origin) return
    committed = true
    clearTimeout(timer)
    markLoaded()
    if (attempts > 1) Logger.info('WINDOW LOADED', { attempts })
  })

  window.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (committed || !isMainFrame || !attempts) return
    failure = { errorCode, errorDescription, page: withoutQuery(validatedURL) }
    // A retry aborts the load it replaces, so an abort waits for loading to stop instead.
    if (errorCode !== ERR_ABORTED) soon(() => retry('failed', { ...failure }))
  })

  window.webContents.on('did-stop-loading', () => {
    if (committed || !attempts) return
    const [reason, details] = failure ? ['failed', { ...failure }] : ['stopped', {}]
    // Our own retry stops the load it replaces; the new one gets its stall timeout, not a retry.
    soon(() =>
      window.webContents.isLoading() ? (timer = setTimeout(stalled, STALL_TIMEOUT_MS)) : retry(reason, details)
    )
  })

  const start = () => !attempts && !window.isDestroyed() && load()
  const readyTimer = setTimeout(() => {
    Logger.warn('WINDOW LOAD WITHOUT SERVER', { waitedMs: READY_TIMEOUT_MS })
    start()
  }, READY_TIMEOUT_MS)
  void ready.then(() => {
    clearTimeout(readyTimer)
    start()
  })

  return {
    loaded,
    navigate(next: string) {
      // Before the first commit, a plain load would be replaced by the pending first load or its retries.
      target = next
      if (committed) window.webContents.loadURL(next).catch(error => Logger.warn('WINDOW NAVIGATION FAILED', { error }))
      else if (attempts) load()
    },
  }
}

export type WindowLoader = ReturnType<typeof loadWindow>
