import { graphQLBasicRequest } from './graphQL'

export async function graphQLCreateAccessKey() {
  return await graphQLBasicRequest(
    ` mutation {
        createAccessKey {
          key
          secret
        }
      }`
  )
}

export async function graphQLDeleteAccessKeys(key: string) {
  return await graphQLBasicRequest(
    ` mutation deleteAccessKey($key: String!) {
        deleteAccessKey(key: $key) 
      }`,
    { key }
  )
}

export async function graphQLToggleAccessKeys(properties: { key: string; enabled: boolean }) {
  return await graphQLBasicRequest(
    ` mutation updateAccessKey($key: String!, $enabled: Boolean!) {
        updateAccessKey(key: $key, enabled: $enabled) {
          key
          enabled
        }
      }`,
    properties
  )
}
