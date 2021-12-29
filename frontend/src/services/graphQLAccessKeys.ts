import { graphQLRequest } from './graphQL'

export const GET_ACCESS_KEYS = `query {
  login {
    accessKeys {
      key
      enabled
      created
      lastUsed
    }
  }
}`
export const CREATE_ACCESS_KEYS = `mutation {
  createAccessKey {
    key
    secret
  }
}`
export const RETREIVE_ACCESS_KEYS = ` 
  mutation updateAccessKey($key: String!, $enabled: Boolean!) {
    updateAccessKey(key: $key, enabled: $enabled) {
      key
      enabled
    }
}`
export const DELETE_ACCESS_KEYS = ` 
  mutation deleteAccessKey($key: String!) {
    deleteAccessKey(key: $key) 
}`


export async function graphQLGetAccessKeys() {
  return await graphQLRequest(
    `${GET_ACCESS_KEYS}`
  )
}

export async function graphQLCreateAccessKey() {
  return await graphQLRequest(
    `${CREATE_ACCESS_KEYS}`
  )
}

export async function graphQLDeleteAccessKeys(properties: any) {
  return await graphQLRequest(
    `${DELETE_ACCESS_KEYS}`, properties
  )
}

export async function graphQLToggleAccessKeys(properties: any) {
  return await graphQLRequest(
    `${RETREIVE_ACCESS_KEYS}`, properties
  )
}
