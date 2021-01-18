import { graphQLBasicRequest } from './graphQL'

const SET_ATTRIBUTES = `
mutation query($attributes: Object!, $serviceId: String) {
  setAttributes(attributes: $attributes, serviceId: $serviceId)
}`

const UNSHARE_DEVICE = `
mutation query($deviceId: String!, $email: [String!]!) {
  share(deviceId: $deviceId, 
    email: $email, 
    action: REMOVE
  )
}`

const SHARE_DEVICE = `
mutation query($deviceId: String!, $email: [String!]!, $scripting: Boolean, $services: [ServiceSharingOptions!]) {
  share(deviceId: $deviceId, 
    email: $email, 
    scripting: $scripting,
    services: $services
  )
}`

const SHARE_ACCOUNT = `
mutation query($emails: [String!]!, $action: SharingAction) {
  link(email: $emails, action: $action, scripting: true)
}
`

const CLAIM_DEVICE = `
mutation query($code: String!) {
  claimDevice(code: $code) {
    id
    name
  }
}
`

export async function graphQLSetAttributes(attributes: ILookup<string | number | undefined>, serviceId: String) {
  return await graphQLBasicRequest(SET_ATTRIBUTES, { attributes: { $remoteit: attributes }, serviceId })
}

export async function graphQLUnShareDevice(params: IShareProps) {
  return await graphQLBasicRequest(UNSHARE_DEVICE, params)
}

export async function graphQLShareDevice(params: IShareProps) {
  return await graphQLBasicRequest(SHARE_DEVICE, params)
}

export async function graphQLLinkAccount(emails: string[], action: 'ADD' | 'REMOVE' | 'LEAVE') {
  return await graphQLBasicRequest(SHARE_ACCOUNT, { emails, action })
}

export async function graphQLClaimDevice(code: string) {
  return await graphQLBasicRequest(CLAIM_DEVICE, { code })
}
