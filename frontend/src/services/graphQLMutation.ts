import { graphQLRequest } from './graphQL'

const SET_ATTRIBUTES = `
mutation query($name: String, $color: Int, $label: String, $serviceId: String) {
  setAttributes(
    attributes: {
      name: $name
      color: $color
      label: $label
    }
    serviceId: $serviceId
  )
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

export async function graphQLSetAttributes(attributes: ILookup, id: String) {
  return await graphQLRequest(SET_ATTRIBUTES, { ...attributes, serviceId: id })
}

export async function graphQLUnShareDevice(params: IShareProps) {
  return await graphQLRequest(UNSHARE_DEVICE, params)
}

export async function graphQLShareDevice(params: IShareProps) {
  return await graphQLRequest(SHARE_DEVICE, { ...params })
}
