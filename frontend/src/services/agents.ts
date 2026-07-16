import { graphQLBasicRequest } from './graphQL'

// Connected Apps data — ALL via graphql (the façade): login.connectedApps merges the agent list
// (graphql calls the Hydra front's admin surface service-to-service on our behalf) with the reach
// policies and last-active timestamps, and revokeAgent revokes through the same path. One host,
// one token (the normal access token) — the desktop no longer talks to the OAuth front directly
// or handles the Cognito ID token.

export async function graphQLGetConnectedApps() {
  return await graphQLBasicRequest(
    ` query ConnectedApps {
        login {
          connectedApps {
            accessTokenTtlSeconds
            agents {
              clientId
              clientName
              logoUri
              capabilities
              audience {
                url
                label
              }
              grantedAt
              reach {
                account
                tags
                operator
              }
              lastActive
            }
          }
        }
      }`
  )
}

export async function graphQLRevokeAgent(clientId: string) {
  return await graphQLBasicRequest(
    ` mutation RevokeAgent($clientId: String!) {
        revokeAgent(clientId: $clientId)
      }`,
    { clientId }
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
