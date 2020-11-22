import { graphQLRequest } from './graphQL'

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

export async function graphQLSetAttributes(attributes: ILookup<string | number | undefined>, serviceId: String) {
  return await graphQLRequest(SET_ATTRIBUTES, { attributes: { $remoteit: attributes }, serviceId })
}

export async function graphQLUnShareDevice(params: IShareProps) {
  return await graphQLRequest(UNSHARE_DEVICE, params)
}

export async function graphQLShareDevice(params: IShareProps) {
  return await graphQLRequest(SHARE_DEVICE, params)
}

export async function graphQLLinkAccount(emails: string[], action: 'ADD' | 'REMOVE' | 'LEAVE') {
  return await graphQLRequest(SHARE_ACCOUNT, { emails, action })
}
