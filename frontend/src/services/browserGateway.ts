import { graphQLBasicRequest } from './graphQL'
import { BROWSER_PLATFORM } from './browserClients'

/* What registers this browser's one shared remote.it client — connectd built for the browser (presence-server
   docs/browser-client-plan.md §5a): a one-time code and where to sign in, given to the client when it asks for them
   (services/browserClient). A client already registered ignores any code handed to it after.

   ONE CLIENT, ONE PERSON. The browser has one client, registered once as one person — the page's own. So with several
   sign-ins in use it reaches what the page's own person reaches, and nothing else: its code is always asked as them,
   and a service only another sign-in reaches is not opened through it at all (helpers/terminalHelper) — it would open
   a terminal that cannot connect, or register the browser as that other person for everything after. */

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
