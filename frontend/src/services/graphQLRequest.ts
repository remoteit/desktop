import { graphQLBasicRequest } from './graphQL'

export async function graphQLLogin() {
  return await graphQLBasicRequest(
    ` query Auth {
        login {
          id
          email
          authhash
          yoicsId
        }
      }`
  )
}

export async function graphQLRegistration(props: {
  name?: string
  tags?: string[]
  platform?: number
  services: IServiceRegistration[]
  accountId: string
}) {
  return await graphQLBasicRequest(
    ` query Registration($accountId: String, $name: String, $platform: Int, $tags: [String!], $services: [ServiceInput!]) {
        login {
          account(id: $accountId) {
            registrationCode(name: $name, platform: $platform, tags: $tags, services: $services)
            registrationCommand(name: $name, platform: $platform, tags: $tags, services: $services)
          }
        }
      }`,
    props
  )
}

export async function graphQLRestoreDevice(props: { id: string; accountId: string }) {
  return await graphQLBasicRequest(
    ` query Restore($id: [String!]!, $accountId: String) {
        login {
          account(id: $accountId) {
            device(id: $id)  {
              restoreCommand
              restoreCode
            }
          }
        }
      }`,
    props
  )
}

export async function graphQLPreloadNetworks(accountId: string) {
  return await graphQLBasicRequest(
    ` query Networks($accountId: String) {
      login {
        account(id: $accountId) {
          networks {
            id
            name
            created
            permissions
            owner {
              id
              email
            }
            connections {
              service {
                id
                device {
                  id
                }          
              }
              name
              port
            }
            tags {
              name
              color
              created
            }
            access {
              user {
                id
                email
              }
            }
          }
        }
      }
    }`,
    { accountId }
  )
}

/* 
  Fetches single network across shared accounts by id
*/
export async function graphQLFetchNetworkSingle(id: string) {
  return await graphQLBasicRequest(
    ` query NetworkServices($id: String!) {
        login {
          network(id: $id)  {
            connections {
              service {
                id
                device {
                  id
                }
              }
            }
          }
        }
      }`,
    { id }
  )
}
