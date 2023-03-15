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
