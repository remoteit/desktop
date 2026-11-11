import { post } from './post'
import { graphQLRequestWithReason } from './graphQL'
import { SchemaField, buildCall } from './graphQLSchema'
import { UNSUPPORTED } from './graphQLDaemon'
import type { ExitFlow } from './adminExitFlows'

/* The flows through exits a person may see (graphql exitFlows; graphql-api docs/PROXY-GROUPS.md §15, "Exit flows: who
   may see them"): their own, through any exit; every flow of a device they manage — made through an exit, or carried as
   one —; every flow through an exit they manage. graphql decides: asked for a device they do not manage, it gives their
   own from it alone. Only exits that keep a flow log are there (remote.it's); an own exit keeps none.

   Newest first, a page at a time: each page hands back `next` to go on from, until there is none. A page reads a
   bounded part of the log, so over hours with few of these flows it may come back short, or empty, with a `next` still.
   A record logged twice can come again on a later page under the same id: kept once here.

   Offered only where the API has it (the portal is released apart from graphql): the query, its arguments and the flow's
   fields are read from the schema once, and a flow asks only for the fields it has. */

export type ExitFlowsScope = { deviceId: string } | { exitId: string }

export type UserExitFlow = ExitFlow & { id: string; exit?: string | null; exitName?: string | null }

export type ExitFlowsPage = { flows: UserExitFlow[]; next: string | null; from: string | null; to: string | null }

// How far back people look (graphql moves from up to it; remote.it admins look further through Admin → Exit flows), and
// the windows offered, in hours: the longest is the whole of it.
export const LOOK_BACK_DAYS = 31
export const WINDOWS = [1, 24, 24 * 7, 24 * LOOK_BACK_DAYS]
export const DEFAULT_WINDOW = 24
export const PAGE_SIZE = 50

const REQUIRED = ['id', 'exitId', 'start', 'end', 'destination', 'up', 'down']
const OPTIONAL = [
  'exit',
  'exitName',
  'proto',
  'clientId',
  'accountId',
  'accountEmail',
  'address',
  'port',
  'localAccount',
  'personId',
  'personEmail',
]
const PAGE = ['next', 'from', 'to']

type Served = { field?: SchemaField; selection: string }

const NONE: Served = { selection: '' }

const TYPE_REF = 'kind name ofType { kind name ofType { kind name ofType { kind name } } }'
const PROBE = `query ExitFlowsFields {
  query: __type(name: "Query") { fields { name args { name type { ${TYPE_REF} } } type { ${TYPE_REF} } } }
  flow: __type(name: "ExitFlow") { fields { name } }
  page: __type(name: "ExitFlowsPage") { fields { name } }
}`

const names = (type: any) => new Set<string>((type?.fields || []).map((f: { name: string }) => f.name))

// What the API serves of exitFlows, from the probe: the query as declared, and what to ask of its answer.
export function parseUserExitFlows(data: any): Served {
  const field: SchemaField | undefined = (data?.query?.fields || []).find((f: SchemaField) => f.name === 'exitFlows')
  const flow = names(data?.flow)
  const page = names(data?.page)
  if (!field || !page.has('flows') || !page.has('next')) return NONE
  if (!['deviceId', 'after'].every(name => field.args?.some(arg => arg.name === name))) return NONE
  if (!REQUIRED.every(name => flow.has(name))) return NONE
  const asked = [...REQUIRED, ...OPTIONAL.filter(name => flow.has(name))].join(' ')
  return { field, selection: `flows { ${asked} } ${PAGE.filter(name => page.has(name)).join(' ')}` }
}

let schema: Promise<Served> | undefined

function served(): Promise<Served> {
  if (!schema)
    schema = post({ query: PROBE }).then(response => {
      if (response === 'ERROR') {
        schema = undefined
        return NONE
      }
      return parseUserExitFlows(response.data?.data)
    })
  return schema
}

// Whether this API has exitFlows. Read once; asked again after a failed probe.
export async function exitFlowsServed(): Promise<boolean> {
  return !!(await served()).field
}

// For tests, and for a change of API or sign-in.
export function resetExitFlows() {
  schema = undefined
}

/* One page. UNSUPPORTED where the API has none; { reason } where graphql refused — a device or exit not there, a window
   beyond its bounds, a stage that keeps no flow log — in its words; 'ERROR' where it could not be read at all. */
export async function fetchExitFlows(
  scope: ExitFlowsScope,
  window: { hours: number; now?: Date },
  after?: string,
  limit = PAGE_SIZE
): Promise<ExitFlowsPage | { reason: string } | 'ERROR' | typeof UNSUPPORTED> {
  const { field, selection } = await served()
  if (!field) return UNSUPPORTED
  const to = window.now ?? new Date()
  const from = new Date(to.getTime() - window.hours * 3600000)
  const call = buildCall(
    'query',
    field,
    {
      deviceId: 'deviceId' in scope ? scope.deviceId : undefined,
      exitId: 'exitId' in scope ? scope.exitId : undefined,
      from: from.toISOString(),
      to: to.toISOString(),
      limit,
      after,
    },
    selection
  )
  const result = await graphQLRequestWithReason(call.query, call.variables)
  if (result === 'ERROR') return 'ERROR'
  if ('reason' in result) return { reason: result.reason }
  const page = result.data?.data?.exitFlows
  if (!page || !Array.isArray(page.flows)) return 'ERROR'
  return { flows: page.flows, next: page.next ?? null, from: page.from ?? null, to: page.to ?? null }
}

// Pages put together: a flow already shown (the same id) is not shown again.
export function appendFlows(shown: UserExitFlow[], page: UserExitFlow[]): UserExitFlow[] {
  const ids = new Set(shown.map(flow => flow.id))
  return [...shown, ...page.filter(flow => !ids.has(flow.id) && ids.add(flow.id))]
}
