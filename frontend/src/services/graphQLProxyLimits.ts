import { post } from './post'
import { graphQLBasicRequest, graphQLGetErrors } from './graphQL'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'
import { ProxyLimits } from '../helpers/proxyLimitHelper'

/* The plans' proxy and exit limits (graphql proxyLimits / setProxyLimit, presence-server docs/proxy-plan.md §5 and §8):
   rows of r3_DefaultLimits and r3_PlanLimits. Remote.it admins only; device-session API only — an API without it
   answers UNSUPPORTED. */

export async function graphQLProxyLimits() {
  const query = `query ProxyLimits { proxyLimits { names plans rows { plan name value scale } } }`
  const response = await post({ query, variables: {} })
  if (response === 'ERROR') return 'ERROR' as const
  const errors = graphQLGetErrors(response, true, { query, variables: {} })
  if (withoutDeviceSessions(errors, 'proxyLimits')) return UNSUPPORTED
  if (errors) return 'ERROR' as const
  return (response.data?.data?.proxyLimits ?? null) as ProxyLimits | null
}

// Sets a limit for a plan (null: the default). `inherit` removes the plan's own row — back to the default's.
export const graphQLSetProxyLimit = (change: {
  plan: string | null
  name: string
  value?: number | null
  scale?: number | null
  inherit?: boolean
}) =>
  graphQLBasicRequest(
    ` mutation SetProxyLimit($plan: String, $name: String!, $value: Int, $scale: Int, $inherit: Boolean) {
        setProxyLimit(plan: $plan, name: $name, value: $value, scale: $scale, inherit: $inherit) { names }
      }`,
    change
  )
