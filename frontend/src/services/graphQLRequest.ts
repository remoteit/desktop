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
