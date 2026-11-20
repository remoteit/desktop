import type { BrowserWindow, WebContents } from 'electron'
import Logger from './Logger'
import { withoutQuery } from './withoutQuery'

const READY_TIMEOUT_MS = 15_000
const STALL_TIMEOUT_MS = 10_000
const RETRY_DELAY_MS = 1_000
const MAX_ATTEMPTS = 5
const ERR_ABORTED = -3

type LoadableWindow = Pick<BrowserWindow, 'isDestroyed'> & {
  webContents: Pick<WebContents, 'on' | 'loadURL' | 'getURL' | 'isLoading' | 'isWaitingForResponse' | 'getOSProcessId'>
}

/** Loads `url` once `ready` (the server) resolves, and again if it fails or neither commits nor fails in time:
 *  a first load once sat on about:blank, with no request and no error, after an update on Windows. */
export default function loadWindow(window: LoadableWindow, url: string, ready: Promise<void>) {
  const origin = new URL(url).origin
  let target = url
  let attempts = 0
  let startedAt = 0
  let startedLoading = false
  let committed = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const retry = (reason: string, details: Record<string, unknown> = {}) => {
    if (attempts >= MAX_ATTEMPTS) return Logger.error('WINDOW LOAD GAVE UP', { attempts, reason, ...details })
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

  const load = () => {
    attempts++
    startedAt = Date.now()
    startedLoading = false
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
    if (attempts > 1) Logger.info('WINDOW LOADED', { attempts })
  })

  window.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL, isMainFrame) => {
    // A retry aborts the load it replaces; that is not a failure to retry again.
    if (committed || !isMainFrame || errorCode === ERR_ABORTED) return
    clearTimeout(timer)
    const details = { errorCode, errorDescription, page: withoutQuery(validatedURL) }
    timer = setTimeout(() => !committed && !window.isDestroyed() && retry('failed', details), RETRY_DELAY_MS)
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
    /** Before the first commit, replaces what is being loaded and retried; after it, a plain load. */
    navigate(next: string) {
      target = next
      if (committed)
        window.webContents.loadURL(next).catch(error => Logger.warn('WINDOW NAVIGATION FAILED', { error }))
      else if (attempts) load()
    },
  }
}

export type WindowLoader = ReturnType<typeof loadWindow>
