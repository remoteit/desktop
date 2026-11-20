import Logger from './Logger'

type LoadableWindow = {
  webContents: {
    on(event: 'did-navigate', listener: (event: unknown, url: string) => void): unknown
    on(
      event: 'did-fail-load',
      listener: (
        event: unknown,
        errorCode: number,
        errorDescription: string,
        validatedURL: string,
        isMainFrame: boolean
      ) => void
    ): unknown
    loadURL(url: string): Promise<void>
  }
  isDestroyed(): boolean
  once(event: 'closed', listener: () => void): unknown
}

type Options = {
  /** Resolves once the server behind the url is listening. */
  ready?: Promise<void>
  readyTimeoutMs?: number
  stallTimeoutMs?: number
  retryDelayMs?: number
  maxAttempts?: number
}

export type WindowLoader = { navigate(url: string): void }

const ERR_ABORTED = -3

/** Loads `url` into `window` once the server is listening, and keeps at it until a page of the app
 *  commits. A first load once stayed on about:blank with no request and no error, after an update on
 *  Windows, so a load that neither commits nor fails in time is started again, as is one that fails.
 *  `navigate` changes what is loaded: before the first commit it replaces the url being retried. */
export default function loadWindow(
  window: LoadableWindow,
  url: string,
  isAppUrl: (url: string) => boolean,
  {
    ready = Promise.resolve(),
    readyTimeoutMs = 15_000,
    stallTimeoutMs = 10_000,
    retryDelayMs = 1_000,
    maxAttempts = 5,
  }: Options = {}
): WindowLoader {
  let target = url
  let attempts = 0
  let committed = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const retry = (reason: string, details: Record<string, unknown> = {}) => {
    if (committed || window.isDestroyed()) return
    if (attempts >= maxAttempts) return Logger.error('WINDOW LOAD GAVE UP', { attempts, reason, ...details })
    Logger.warn('WINDOW LOAD RETRY', { attempt: attempts + 1, reason, ...details })
    load()
  }

  const load = () => {
    attempts++
    clearTimeout(timer)
    timer = setTimeout(() => retry('stalled'), stallTimeoutMs)
    // Failures arrive through did-fail-load.
    window.webContents.loadURL(target).catch(() => undefined)
  }

  window.webContents.on('did-navigate', (_, navigatedUrl) => {
    if (committed || !isAppUrl(navigatedUrl)) return
    committed = true
    clearTimeout(timer)
    if (attempts > 1) Logger.info('WINDOW LOADED', { attempts })
  })

  window.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL, isMainFrame) => {
    // A retry aborts the load it replaces; that is not a failure to retry again.
    if (committed || !isMainFrame || errorCode === ERR_ABORTED) return
    clearTimeout(timer)
    // An auth callback's query carries its OAuth code, so the log keeps only the part before it.
    const page = validatedURL.split('?')[0]
    timer = setTimeout(() => retry('failed', { errorCode, errorDescription, page }), retryDelayMs)
  })

  window.once('closed', () => clearTimeout(timer))

  let readyTimer: ReturnType<typeof setTimeout> | undefined
  void Promise.race([
    ready.then(() => true),
    new Promise<false>(resolve => (readyTimer = setTimeout(() => resolve(false), readyTimeoutMs))),
  ]).then(listening => {
    clearTimeout(readyTimer)
    if (!listening) Logger.warn('WINDOW LOAD WITHOUT SERVER', { waitedMs: readyTimeoutMs })
    if (!window.isDestroyed() && !attempts) load()
  })

  return {
    navigate(next) {
      target = next
      if (committed)
        window.webContents.loadURL(next).catch(error => Logger.warn('WINDOW NAVIGATION FAILED', { error }))
      else if (attempts) load()
    },
  }
}
