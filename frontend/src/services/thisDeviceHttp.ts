import {
  BridgeError,
  BridgeErrorCode,
  BridgeEvent,
  BridgeEvents,
  BridgeMethod,
  BridgeMethods,
  BridgeTransport,
  registerBridgeTransport,
} from './thisDevice'

/* The desktop's transport for thisDevice (thisDevice.ts, "Desktop"): the menu app serves this bundle from its
   token-protected local server, and the bridge is paths beside the page — POST `bridge/<method>` with the args as
   JSON, answered 200 with the result or 4xx/5xx with `{ "error": { "code", "message" } }`; the events are server-sent
   at GET `bridge/events`, `event: <name>` with the payload as JSON data. Every path is relative to the page, so the
   token the menu put in the page's path rides every call and nothing here knows it. */

const CODES: BridgeErrorCode[] = ['unsupported', 'notSignedIn', 'refused', 'busy', 'unavailable', 'cancelled', 'failed']

/** The bridge's URL for `path`, beside the page (its directory, whatever file the page itself is). */
export const bridgeURL = (path: string, base: string = document.baseURI) => new URL('bridge/' + path, base).toString()

export function httpTransport(base?: string, fetcher: typeof fetch = (input, init) => fetch(input, init)): BridgeTransport {
  let source: EventSource | undefined
  const listeners: { [event: string]: Set<(payload: any) => void> } = {}

  const open = () => {
    if (source || typeof EventSource === 'undefined') return
    source = new EventSource(bridgeURL('events', base))
    for (const event of Object.keys(listeners)) attach(event)
  }
  const attached = new Set<string>()
  const attach = (event: string) => {
    if (!source || attached.has(event)) return
    attached.add(event)
    source.addEventListener(event, (e: MessageEvent) => {
      let payload: unknown
      try {
        payload = JSON.parse(e.data)
      } catch {
        return
      }
      for (const listener of listeners[event] ?? []) listener(payload)
    })
  }

  return {
    async call<M extends BridgeMethod>(method: M, args: BridgeMethods[M]['args']) {
      let response: Response
      try {
        response = await fetcher(bridgeURL(method, base), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(args ?? {}),
          cache: 'no-store',
        })
      } catch (error: any) {
        throw new BridgeError('unavailable', error?.message || 'the app did not answer')
      }
      const body: any = await response.json().catch(() => undefined)
      if (!response.ok) {
        const code: BridgeErrorCode = CODES.includes(body?.error?.code) ? body.error.code : 'failed'
        throw new BridgeError(code, body?.error?.message || `${method}: ${response.status}`)
      }
      return body as BridgeMethods[M]['result']
    },
    on<E extends BridgeEvent>(event: E, listener: (payload: BridgeEvents[E]) => void) {
      ;(listeners[event] ??= new Set()).add(listener)
      open()
      attach(event)
      return () => {
        listeners[event]?.delete(listener)
      }
    },
  }
}

/** Registers the desktop transport: in an embedded build that is not running as a Capacitor native app (that shell
 *  registers its own). Whether a shell is really there is info()'s to say — a bundle opened by itself answers nothing
 *  at bridge/info, and thisDevice is absent. */
export function registerHttpBridge(native: boolean) {
  if (native) return
  registerBridgeTransport(async () => httpTransport())
}
