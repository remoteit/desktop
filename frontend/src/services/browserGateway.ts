import { graphQLBasicRequest } from './graphQL'

/* A device's web service opened in its own tab with nothing installed here (presence-server
   docs/browser-client-plan.md §5): the browser's one shared client — connectd built for the browser — carries the
   tab's requests to the device. The tab is the device's own origin, its name in device subnets; the gateway answers
   it when no agent here does. The first tab registers the browser's client with a one-time code, passed in the URL's
   fragment with where to sign in (no server sees a fragment); a browser whose client is registered ignores it.

   Locally, this Mac's agent answers *.on.local.remote.it, so the gateway's names are one label under the proxy's
   certificate: w<port>-<name>-<owner>.local.remote.it. On a stage, the device's own name — the port a name means
   there is still to be settled; until then it is the web port. */

export function gatewayURL(name: string, port?: number): string {
  const local = /^([a-z0-9]+(?:-[a-z0-9]+)+)\.on\.local\.remote\.it$/.exec(name)
  if (local) return `https://w${port || 80}-${local[1]}.local.remote.it/`
  return `https://${name}/`
}

type Handoff = { code: string; presence: string[]; reflector: string }

async function handoff(): Promise<Handoff | null> {
  const response = await graphQLBasicRequest(`query BrowserClientHandoff {
    deviceSessionServers { presence reflector }
    login { registrationCode(name: "browser", clientOnly: true, userMode: true, oneTimeUse: true) }
  }`)
  if (response === 'ERROR') return null
  const data = response.data?.data
  const servers = data?.deviceSessionServers
  const code = data?.login?.registrationCode
  if (!servers || !code) return null
  return { code, presence: servers.presence, reflector: servers.reflector }
}

const fragment = (h: Handoff) => btoa(JSON.stringify(h)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

// Opens the service in a new tab through the browser client. The tab opens on the click — a tab opened after the
// code is fetched would be a pop-up the browser refuses — and goes to the device once it has the code.
export async function openThroughGateway(name: string, port?: number): Promise<boolean> {
  const tab = window.open('', '_blank')
  const h = await handoff()
  if (!h) {
    tab?.close()
    return false
  }
  const url = `${gatewayURL(name, port)}#rit=${fragment(h)}`
  if (tab) {
    tab.opener = null
    tab.location.href = url
  } else {
    window.location.assign(url)
  }
  return true
}
