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
  account: string
}) {
  return await graphQLBasicRequest(
    ` query Registration($account: String, $name: String, $platform: Int, $tags: [String!], $services: [ServiceInput!]) {
        login {
          account(id: $account) {
            registrationCode(name: $name, platform: $platform, tags: $tags, services: $services)
            registrationCommand(name: $name, platform: $platform, tags: $tags, services: $services)
          }
        }
      }`,
    props
  )
}

export async function graphQLRestoreDevice(props: { id: string; account: string }) {
  return await graphQLBasicRequest(
    ` query Device($id: [String!]!, $account: String) {
        login {
          account(id: $account) {
            device(id: $id)  {
              restoreCommand
            }
          }
        }
      }`,
    props
  )
}
