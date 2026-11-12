import browser, { windowOpen } from '../services/browser'
import { PORTAL_URL } from '../constants'

/* Our web SSH (pages/TerminalPage): a terminal on a device's SSH service, its session through the browser's remote.it
   client (services/browserClient), in its own tab — #/terminal?name=<subnet name>&port=…&title=…&service=<id>.

   The client takes a terminal's channel only from the web portal's origin (connectd golang/web/names.js `portal`:
   https://app[.<stage>].remote.it). The desktop and mobile apps' pages are no portal's — the desktop's is the local
   backend's 127.0.0.1 — so from there the terminal opens in the web portal, in the system browser, where the person is
   signed in as on the web. The portal is the name's stage's: <label>-<owner>.on.<domain> is app.<domain>'s. */

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

/** Where the terminal opens: this page's own app on the web, the web portal from the desktop or mobile app. */
export function terminalURL({ name, port, title, service }: TerminalTarget): string {
  const query = new URLSearchParams({ name, port: String(port), title: title || name })
  if (service) query.set('service', service)
  const base = browser.isNative ? `${portalOrigin(name)}/` : `${location.origin}${location.pathname}`
  return `${base}#/terminal?${query}`
}

/** Opens the terminal in its own tab — on the desktop and mobile apps, in the system browser. */
export function openTerminal(target: TerminalTarget) {
  const url = terminalURL(target)
  // The desktop app's main process sends every window it did not make to the system browser (electron ElectronApp
  // setWindowOpenHandler); a phone's is opened there by name.
  if (browser.isNative) windowOpen(url, '_blank', true)
  else window.open(url, '_blank')
}
