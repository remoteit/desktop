import type { TFunction } from 'i18next'
import { post } from './post'

/* Multi-port services (graphql-api docs/MULTI-PORT-SERVICES.md): a service's ports are a list of ports and ranges,
   the first where its type's launch goes. Address mode (the device subnet) reaches every one; a connection here —
   localhost, a link, a launch — still reaches the first port only.

   Offered only where the API keeps the list: whether it does is read from its schema once (Service.ports and
   User.multiPortServices, as jobRunOptions reads JobRunOptions), so no query names either field on an older API. Then
   whether it is on is the account's answer (User.multiPortServices for the account that owns the service). */

export const MAX_PORT_ENTRIES = 100 // graphql's cap on a service's entries

let schema: Promise<boolean> | undefined
const accounts = new Map<string, Promise<boolean>>()

// Whether this API has Service.ports and User.multiPortServices. Read once; asked again after a failed request.
export function multiPortServicesServed(): Promise<boolean> {
  if (!schema)
    schema = post({
      query: `query MultiPortServicesFields {
        service: __type(name: "Service") { fields { name } }
        user: __type(name: "User") { fields { name } }
      }`,
    }).then(response => {
      if (response === 'ERROR') {
        schema = undefined
        return false
      }
      const has = (type: any, name: string) => !!type?.fields?.some((f: { name: string }) => f.name === name)
      const data = response.data?.data
      return has(data?.service, 'ports') && has(data?.user, 'multiPortServices')
    })
  return schema
}

// Whether the account's services take a list of ports: never where the API cannot say. Read once per account.
export function multiPortServicesOn(accountId?: string): Promise<boolean> {
  if (!accountId) return Promise.resolve(false)
  let on = accounts.get(accountId)
  if (!on) {
    on = multiPortServicesServed().then(async served => {
      if (!served) return false
      const response = await post({
        query: `query MultiPortServices($accountId: String) { login { id account(id: $accountId) { id multiPortServices } } }`,
        variables: { accountId },
      })
      if (response === 'ERROR') accounts.delete(accountId)
      return response !== 'ERROR' && !!response.data?.data?.login?.account?.multiPortServices
    })
    accounts.set(accountId, on)
  }
  return on
}

// For tests, and for a change of API or sign-in.
export function resetMultiPortServices() {
  schema = undefined
  accounts.clear()
}

// More than one port: a second entry, or a first that is a range.
export function isMultiPort(service?: Pick<IService, 'ports'>): boolean {
  const ports = service?.ports
  return !!ports && (ports.length > 1 || ports[0]?.includes('-'))
}

export function formatPorts(ports?: string[]) {
  return ports?.join(', ') ?? ''
}

// The port an entry starts at: "22" is 22, "5900-5910" is 5900.
export function firstPortOf(entry: string) {
  return Number(entry.split('-')[0])
}

const PORT = /^\d{1,5}$/
const valid = (port: string) => PORT.test(port) && Number(port) >= 1 && Number(port) <= 65535

/* A typed list, by graphql's rules: entries separated by commas or spaces, each a port or a range low to high, ports
   1 to 65535, at most 100 entries. graphql merges and de-duplicates on save; the order typed is kept (the first is
   the type's launch). Empty is an error where a port is required. */
export function parsePorts(t: TFunction, text: string, required = true): { ports: string[]; error?: string } {
  const entries = text
    .split(/[\s,]+/)
    .map(e => e.trim())
    .filter(Boolean)
  if (!entries.length)
    return required ? { ports: [], error: t('multiPort.required', 'At least one port') } : { ports: [] }
  if (entries.length > MAX_PORT_ENTRIES)
    return { ports: [], error: t('multiPort.tooMany', 'At most {{max}} entries', { max: MAX_PORT_ENTRIES }) }
  const ports: string[] = []
  for (const entry of entries) {
    const [low, high, ...rest] = entry.split('-')
    const ok = !rest.length && valid(low) && (high === undefined || (valid(high) && Number(low) <= Number(high)))
    if (!ok)
      return {
        ports: [],
        error: t('multiPort.invalid', '{{entry}}: a port 1 to 65535, or a range low to high like 5900-5910', {
          entry,
        }),
      }
    ports.push(high === undefined || low === high ? String(Number(low)) : `${Number(low)}-${Number(high)}`)
  }
  return { ports }
}
