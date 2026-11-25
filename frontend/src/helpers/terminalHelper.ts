import browser, { windowOpen } from '../services/browser'
import { EMBEDDED, PORTAL_URL, TERMINAL_PATH } from '../constants'
import { primaryReachesNow } from '../selectors/signIns'

/* Our web SSH (pages/TerminalPage): a terminal on a device's SSH service, its session through the browser's remote.it
   client (services/browserClient), in its own tab — #/terminal?name=<subnet name>&port=…&title=…&service=<id>.

   The client takes a terminal's channel only from the web portal's origin (connectd golang/web/names.js `portal`:
   https://app[.<stage>].remote.it). The desktop and mobile apps' pages are no portal's — the desktop's is the local
   backend's 127.0.0.1, and the portal embedded in the menu app is its local server's — so from there the terminal opens
   in the web portal, in the system browser, where the person is signed in as on the web. The portal is the name's stage's: <label>-<owner>.on.<domain> is app.<domain>'s. */

export type TerminalTarget = {
  name: string // the service's name in device subnets
  port: number
  title?: string // the tab's title: the name when there is none
  service?: string // the service's id: its login and certificate are asked of graphql for it
}

/** The web portal of a name's stage, or the build's portal for a name that does not say. */
export function portalOrigin(name: string): string {
  const stage = /\.on\.((?:[a-z0-9-]+\.)*remote\.it)$/i.exec(name)
  return stage ? `https://app.${stage[1].toLowerCase()}` : new URL(PORTAL_URL).origin
}

/** Whether this page is an app's, not the web portal's own: the desktop's, a phone's, or the portal the menu app embeds. */
export const inApp = (): boolean => browser.isNative || EMBEDDED

/** Where the terminal opens: this page's own app on the web, the web portal from an app. */
export function terminalURL({ name, port, title, service }: TerminalTarget): string {
  const query = new URLSearchParams({ name, port: String(port), title: title || name })
  if (service) query.set('service', service)
  const base = inApp() ? `${portalOrigin(name)}/` : `${location.origin}${location.pathname}`
  return `${base}#${TERMINAL_PATH}?${query}`
}

/** Whether the terminal can reach a service from here. In this page's own app its session goes through the browser's
 *  one client, which is the page's own person's (services/browserGateway, "ONE CLIENT, ONE PERSON"): a service only
 *  another sign-in reaches is not opened in it. From an app it opens in the web portal, whose own sign-ins
 *  say. */
export const terminalReaches = (service?: string): boolean => inApp() || primaryReachesNow(service)

/** Opens the terminal in its own tab — from an app, in the system browser. Not for a service the
 *  browser's client cannot reach, which is said (OTHER_SIGN_IN). */
export function openTerminal(target: TerminalTarget): true | 'OTHER_SIGN_IN' {
  if (!terminalReaches(target.service)) return 'OTHER_SIGN_IN'
  const url = terminalURL(target)
  // The desktop app's main process sends every window it did not make to the system browser (electron ElectronApp
  // setWindowOpenHandler), and so does the menu app; a phone's is opened there by name.
  if (inApp()) windowOpen(url, '_blank', true)
  else window.open(url, '_blank')
  return true
}
