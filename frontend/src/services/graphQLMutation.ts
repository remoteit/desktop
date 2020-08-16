import { graphQLRequest } from './graphQL'

const SET_ATTRIBUTES = `
mutation query($name: String, $labelId: Int, $accessDisabled: Boolean, $serviceId: String) {
  setAttributes(
    attributes: {
      name: $name
      labelId: $labelId
      accessDisabled: $accessDisabled
    }
    serviceId: $serviceId
  )
}`

export async function graphQLSetAttributes(attributes: ILookup, id: String) {
  return await graphQLRequest(SET_ATTRIBUTES, { ...attributes, serviceId: id })
}
