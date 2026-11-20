import { graphQLBasicRequest } from './graphQL'
import { BROWSER_PLATFORM } from './browserClients'
import browser, { openInSystem } from './browser'

/* A device's web service opened in its own tab with nothing installed here (presence-server
   docs/browser-client-plan.md §5): the browser's one shared client — connectd built for the browser — carries the
   tab's requests to the device. The tab is the device's own origin, its name in device subnets; the gateway answers
   it when no agent here does. The first tab registers the browser's client with a one-time code, passed in the URL's
   fragment with where to sign in (no server sees a fragment); a browser whose client is registered ignores it.

   The tab is the device's own name, as with an agent here: its web service, whatever port that is on — so the same
   link reaches it through an agent when there is one, and through the gateway otherwise. */

export function gatewayURL(name: string): string {
  return `https://${name}/`
}

export type Handoff = { code: string; presence: string[]; reflector: string }

// A browser's client is kept, and used again on the next visit; one never back — a browser given up, a profile deleted —
// is disabled by graphql's expiry after this long offline (reason expired), and restores itself if it does come back.
export const BROWSER_CLIENT_TIMEOUT_SECONDS = 30 * 24 * 60 * 60

export async function handoff(): Promise<Handoff | null> {
  const response = await graphQLBasicRequest(`query BrowserClientHandoff {
    deviceSessionServers { presence reflector }
    login { registrationCode(name: "browser", clientOnly: true, userMode: true, oneTimeUse: true, timeout: ${BROWSER_CLIENT_TIMEOUT_SECONDS}, platform: ${BROWSER_PLATFORM}) }
  }`)
  if (response === 'ERROR') return null
  const data = response.data?.data
  const servers = data?.deviceSessionServers
  const code = data?.login?.registrationCode
  if (!servers || !code) return null
  return { code, presence: servers.presence, reflector: servers.reflector }
}

const fragment = (h: Handoff) => btoa(JSON.stringify(h)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

// A web tab needs to be reserved on the click to pass the popup blocker. The iOS shell can hand the complete URL
// to the system browser once the code arrives.
export async function openThroughGateway(name: string): Promise<boolean> {
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
