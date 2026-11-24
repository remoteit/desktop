import { graphQLBasicRequest } from './graphQL'
import { BROWSER_PLATFORM } from './browserClients'
import browser, { openInSystem } from './browser'
import { primaryReachesNow } from '../selectors/signIns'

/* A device's web service opened in its own tab with nothing installed here (presence-server
   docs/browser-client-plan.md §5): the browser's one shared client — connectd built for the browser — carries the
   tab's requests to the device. The tab is the device's own origin, its name in device subnets; the gateway answers
   it when no agent here does. The first tab registers the browser's client with a one-time code, passed in the URL's
   fragment with where to sign in (no server sees a fragment); a browser whose client is registered ignores it.

   The tab is the device's own name, as with an agent here: its web service, whatever port that is on — so the same
   link reaches it through an agent when there is one, and through the gateway otherwise.

   ONE CLIENT, ONE PERSON. The browser has one client, registered once as one person — the page's own (the portal's own
   channel to it registers it so too, services/browserClient, and a client once registered ignores any code handed to
   it after). So with several sign-ins in use it reaches what the page's own person reaches, and nothing else: its code
   is always asked as them, and a service only another sign-in reaches is not opened through it at all — it would
   open a tab that cannot reach it, or register the browser as that other person for everything after. That is said
   to whoever asks (OTHER_SIGN_IN), who connects another way. */

export function gatewayURL(name: string): string {
  return `https://${name}/`
}

export type Handoff = { code: string; presence: string[]; reflector: string }

// A browser's client is kept, and used again on the next visit; one never back — a browser given up, a profile deleted —
// is disabled by graphql's expiry after this long offline (reason expired), and restores itself if it does come back.
export const BROWSER_CLIENT_TIMEOUT_SECONDS = 30 * 24 * 60 * 60

export async function handoff(): Promise<Handoff | null> {
  const response = await graphQLBasicRequest(
    `query BrowserClientHandoff {
    deviceSessionServers { presence reflector }
    login { registrationCode(name: "browser", clientOnly: true, userMode: true, oneTimeUse: true, timeout: ${BROWSER_CLIENT_TIMEOUT_SECONDS}, platform: ${BROWSER_PLATFORM}) }
  }`,
    {},
    false,
    { sub: '' }
  )
  if (response === 'ERROR') return null
  const data = response.data?.data
  const servers = data?.deviceSessionServers
  const code = data?.login?.registrationCode
  if (!servers || !code) return null
  return { code, presence: servers.presence, reflector: servers.reflector }
}

const fragment = (h: Handoff) => btoa(JSON.stringify(h)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

// What opening a service through the browser's client came to: opened, not opened, or not this client's to open.
export const OTHER_SIGN_IN = 'OTHER_SIGN_IN'
export type GatewayOpened = boolean | typeof OTHER_SIGN_IN

/** Whether a service is one the browser's client can reach: one the page's own person's sign-in serves. */
export const throughGateway = (serviceId?: string): boolean => primaryReachesNow(serviceId)

// A web tab needs to be reserved on the click to pass the popup blocker. The iOS shell can hand the complete URL
// to the system browser once the code arrives. `serviceId`: the service, where it is known — whose sign-in is looked at.
export async function openThroughGateway(name: string, serviceId?: string): Promise<GatewayOpened> {
  if (!throughGateway(serviceId)) return OTHER_SIGN_IN
  const external = browser.isIOSDeviceApp
  const tab = external ? null : window.open('', '_blank')
  const h = await handoff()
  if (!h) {
    tab?.close()
    return false
  }
  const url = `${gatewayURL(name)}#rit=${fragment(h)}`
  if (external) return openInSystem(url)
  if (tab) {
    tab.opener = null
    tab.location.href = url
  } else {
    window.location.assign(url)
  }
  return true
}
