import { post } from './post'
import { graphQLRequestWithReason } from './graphQL'
import { SchemaField, buildCall } from './graphQLSchema'
import { UNSUPPORTED } from './graphQLDaemon'

/* The flows through remote.it's public exits (graphql adminExitFlows, resolvers/exit-flows-resolver.ts): each exit logs
   one record per flow it carried when the flow ends — its start and end, the account charged, the client device, the
   session, the address and port the internet saw, the destination, the bytes each way — and, since graphql-api
   docs/PROXY-GROUPS.md §15, the OS account on the client that opened it and the person signed in on that account.

   A lookup answers a complaint: one of our addresses, a port, or both, and a time; the flows open within withinMinutes
   either side of it, across every exit, gone ones too, found up to laterHours after for those that ended later. Nothing
   else narrows it on graphql's side, and there is no cursor: a lookup gives at most `limit` flows, earliest first, and
   says when more matched. remote.it admins alone, and graphql logs every lookup: who asked, what, how many it found.

   Offered only where the API has it. The portal is released apart from graphql, so the query, its arguments and the
   flow's fields are read from the schema once: the call takes the arguments the API declares, typed as it types them,
   and asks only for the fields it has — a graphql from before §15 answers without the OS account and the person. */

export type ExitFlow = {
  exitId: string
  start: string
  end: string
  accountId?: string | null // charged for the exit's session
  accountEmail?: string | null
  clientId?: string | null // the device that used the exit
  sessionId?: string | null
  proto?: string
  address?: string // the address the internet saw
  port?: number // and its port
  source?: string // the exit's own address and port
  destination: string
  up: number // bytes to the destination
  down: number // and from it
  received?: string
  localAccount?: string | null // a UID, or a SID on Windows
  personId?: string | null
  personEmail?: string | null
}

export type ExitFlowsFound = { flows: ExitFlow[]; truncated: boolean; from: string | null; to: string | null }

export type ExitFlowLookup = {
  at: Date
  address?: string
  port?: number
  withinMinutes?: number
  laterHours?: number
  limit?: number
}

// graphql's own bounds (services/exit-flows.ts LIMITS, DEFAULTS); it refuses beyond them and says why.
export const WITHIN_MINUTES = [5, 15, 30, 60, 180]
export const LATER_HOURS = [0, 1, 6, 24]
export const LIMITS = [200, 500, 1000]
export const DEFAULTS = { withinMinutes: 15, laterHours: 1, limit: 200 }

// A flow is nothing without these; the rest are asked for where the API has them.
const REQUIRED = ['exitId', 'start', 'end', 'destination', 'up', 'down']
const OPTIONAL = [
  'accountId',
  'accountEmail',
  'clientId',
  'sessionId',
  'proto',
  'address',
  'port',
  'source',
  'received',
  'localAccount',
  'personId',
  'personEmail',
]
const RESULT = ['truncated', 'from', 'to']

type Served = { field?: SchemaField; selection: string }

const NONE: Served = { selection: '' }

const TYPE_REF = 'kind name ofType { kind name ofType { kind name ofType { kind name } } }'
const PROBE = `query AdminExitFlowsFields {
  query: __type(name: "Query") { fields { name args { name type { ${TYPE_REF} } } type { ${TYPE_REF} } } }
  flow: __type(name: "ExitFlow") { fields { name } }
  flows: __type(name: "ExitFlows") { fields { name } }
}`

const names = (type: any) => new Set<string>((type?.fields || []).map((f: { name: string }) => f.name))

// What the API serves of the lookup, from the probe: the query as declared, and what to ask of its answer.
export function parseExitFlows(data: any): Served {
  const field: SchemaField | undefined = (data?.query?.fields || []).find(
    (f: SchemaField) => f.name === 'adminExitFlows'
  )
  const flow = names(data?.flow)
  const flows = names(data?.flows)
  if (!field || !field.args?.some(arg => arg.name === 'at') || !flows.has('flows')) return NONE
  if (!REQUIRED.every(name => flow.has(name))) return NONE
  const asked = [...REQUIRED, ...OPTIONAL.filter(name => flow.has(name))].join(' ')
  return { field, selection: `flows { ${asked} } ${RESULT.filter(name => flows.has(name)).join(' ')}`.trim() }
}

let schema: Promise<Served> | undefined

function exitFlows(): Promise<Served> {
  if (!schema)
    schema = post({ query: PROBE }).then(response => {
      if (response === 'ERROR') {
        schema = undefined
        return NONE
      }
      return parseExitFlows(response.data?.data)
    })
  return schema
}

// Whether this API has the lookup. Read once; asked again after a failed probe.
export async function adminExitFlowsServed(): Promise<boolean> {
  return !!(await exitFlows()).field
}

// For tests, and for a change of API or sign-in.
export function resetAdminExitFlows() {
  schema = undefined
}

/* One lookup. UNSUPPORTED where the API has none; { reason } where graphql refused it — an address that is not one,
   neither address nor port, a window beyond its bounds, a stage that keeps no flow log — in its words; 'ERROR' where it
   could not be read at all. */
export async function fetchAdminExitFlows(
  lookup: ExitFlowLookup
): Promise<ExitFlowsFound | { reason: string } | 'ERROR' | typeof UNSUPPORTED> {
  const { field, selection } = await exitFlows()
  if (!field) return UNSUPPORTED
  const call = buildCall(
    'query',
    field,
    {
      at: lookup.at.toISOString(),
      address: lookup.address?.trim() || undefined,
      port: lookup.port,
      withinMinutes: lookup.withinMinutes,
      laterHours: lookup.laterHours,
      limit: lookup.limit,
    },
    selection
  )
  const result = await graphQLRequestWithReason(call.query, call.variables)
  if (result === 'ERROR') return 'ERROR'
  if ('reason' in result) return { reason: result.reason }
  const found = result.data?.data?.adminExitFlows
  if (!found || !Array.isArray(found.flows)) return 'ERROR'
  return { flows: found.flows, truncated: !!found.truncated, from: found.from ?? null, to: found.to ?? null }
}

// Who on the client opened a flow: "pat@example.com on account 501", the person by ID where graphql has no email for
// them, the OS account alone where no one was signed in on it; null where the client said neither.
export function flowOpener(flow: Pick<ExitFlow, 'localAccount' | 'personId' | 'personEmail'>): string | null {
  const person = flow.personEmail || flow.personId
  if (person && flow.localAccount) return `${person} on account ${flow.localAccount}`
  if (person) return person
  if (flow.localAccount) return `OS account ${flow.localAccount}`
  return null
}
