import axios from 'axios'
import { store } from '../store'
import { getApiURL } from '../helpers/apiHelper'
import { CONSENTS_API, CONSENTS_BETA_API } from '../constants'
import { graphQLBasicRequest } from './graphQL'

// The agent-management API (list / revoke a user's authorized OAuth apps) is the Hydra OAuth front
// — NOT the graphql API — because only it can reach Hydra's admin to read/kill consent sessions.
// It authenticates with the user's own Cognito ID token (a different app-client audience than the
// front's own login client, allow-listed server-side via CONSENTS_ALLOWED_AUDIENCES).
//
// The front must be the SAME environment the graphql API is pointed at (dev Hydra pairs with
// dev/beta/evan graphql; prod with prod), so derive it from the ACTIVE graphql target — honoring
// the in-app API switch and VITE overrides — rather than a second, independent switch. Prod graphql
// is the only `…/graphql/v1` path; anything else (beta, an evan/dev override, the API switcher) is
// non-prod → the dev front. VITE_CONSENTS_API / VITE_CONSENTS_BETA_API still override explicitly.
function consentsBase(): string {
  const graphql = getApiURL() || ''
  return graphql.includes('/graphql/v1') ? CONSENTS_API : CONSENTS_BETA_API
}

// The /consents API keys on the verified email, which lives in the ID token (the graphql access
// token used elsewhere carries no email), so this path deliberately uses getIdToken(), not getToken().
async function idToken(): Promise<string> {
  try {
    const session = await store.getState().auth.authService?.currentCognitoSession()
    return session?.getIdToken().getJwtToken() || ''
  } catch (error) {
    console.error('AGENTS ID TOKEN ERROR', error)
    return ''
  }
}

export type IAuthorizedAgentsResult = { agents: IAuthorizedAgent[]; accessTokenTtlSeconds: number }

export async function fetchAuthorizedAgents(): Promise<IAuthorizedAgentsResult> {
  const url = `${consentsBase()}/consents`
  const empty = { agents: [], accessTokenTtlSeconds: 300 }
  try {
    const token = await idToken()
    if (!token) {
      console.warn('CONNECTED APPS: no Cognito ID token; skipping', url)
      return empty
    }
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
    return {
      agents: response.data?.agents || [],
      accessTokenTtlSeconds: response.data?.accessTokenTtlSeconds || 300,
    }
  } catch (error) {
    console.error(`CONNECTED APPS: GET ${url} failed`, error?.response?.status, error?.message, error)
    return empty
  }
}

export async function revokeAuthorizedAgent(clientId: string): Promise<boolean> {
  const url = `${consentsBase()}/consents/${encodeURIComponent(clientId)}/revoke`
  try {
    const token = await idToken()
    if (!token) return false
    const response = await axios.post(url, null, { headers: { Authorization: `Bearer ${token}` } })
    return !!response.data?.revoked
  } catch (error) {
    console.error(`CONNECTED APPS: POST ${url} failed`, error?.response?.status, error?.message, error)
    return false
  }
}

// Device-reach policy is a graphql concern (r3_AgentScope, applied at visibleDevices), keyed by the
// agent's OAuth client id. Read via login.agentScopes; write via setAgentScope / clearAgentScope.
export async function graphQLGetAgentScopes() {
  return await graphQLBasicRequest(
    ` query AgentScopes {
        login {
          agentScopes {
            clientId
            accounts {
              account
              tags
              operator
            }
            updated
          }
        }
      }`
  )
}

// `accounts` = the per-account reach rules; null/empty clears the limit (full reach).
export async function graphQLSetAgentScope(clientId: string, accounts: IAccountReach[] | null) {
  return await graphQLBasicRequest(
    ` mutation SetAgentScope($clientId: String!, $accounts: [AgentAccountReachInput!]) {
        setAgentScope(clientId: $clientId, accounts: $accounts)
      }`,
    {
      clientId,
      accounts: accounts?.length
        ? accounts.map(rule => ({ account: rule.account, tags: rule.tags, operator: rule.operator }))
        : null,
    }
  )
}

export async function graphQLClearAgentScope(clientId: string) {
  return await graphQLBasicRequest(
    ` mutation ClearAgentScope($clientId: String!) {
        clearAgentScope(clientId: $clientId)
      }`,
    { clientId }
  )
}
