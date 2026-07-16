import axios from 'axios'
import { store } from '../store'
import { version } from '../helpers/versionHelper'
import { CONSENTS_API, CONSENTS_BETA_API } from '../constants'
import { graphQLBasicRequest } from './graphQL'

// The agent-management API (list / revoke a user's authorized OAuth apps) is the Hydra OAuth front
// — NOT the graphql API — because only it can reach Hydra's admin to read/kill consent sessions.
// It authenticates with the user's own Cognito ID token (a different app-client audience than the
// front's own login client, allow-listed server-side via CONSENTS_ALLOWED_AUDIENCES).
function consentsBase(): string {
  return version.includes('alpha') || version.includes('beta') ? CONSENTS_BETA_API : CONSENTS_API
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

export async function fetchAuthorizedAgents(): Promise<IAuthorizedAgent[]> {
  const token = await idToken()
  if (!token) return []
  const response = await axios.get(`${consentsBase()}/consents`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data?.agents || []
}

export async function revokeAuthorizedAgent(clientId: string): Promise<boolean> {
  const token = await idToken()
  if (!token) return false
  const response = await axios.post(`${consentsBase()}/consents/${encodeURIComponent(clientId)}/revoke`, null, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return !!response.data?.revoked
}

// Device-reach policy is a graphql concern (r3_AgentScope, applied at visibleDevices), keyed by the
// agent's OAuth client id. Read via login.agentScopes; write via setAgentScope / clearAgentScope.
export async function graphQLGetAgentScopes() {
  return await graphQLBasicRequest(
    ` query AgentScopes {
        login {
          agentScopes {
            clientId
            accounts
            tags
            tagOperator
            updated
          }
        }
      }`
  )
}

export async function graphQLSetAgentScope(
  clientId: string,
  accounts: string[] | null,
  tags: string[] | null,
  operator: ITagOperator
) {
  return await graphQLBasicRequest(
    ` mutation SetAgentScope($clientId: String!, $accounts: [String!], $tags: [String!], $operator: ListOperator) {
        setAgentScope(clientId: $clientId, accounts: $accounts, tags: $tags, operator: $operator)
      }`,
    { clientId, accounts, tags, operator }
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
