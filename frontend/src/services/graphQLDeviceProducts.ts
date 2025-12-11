import { graphQLBasicRequest } from './graphQL'

export async function graphQLPlatformTypes() {
  return await graphQLBasicRequest(
    ` query PlatformTypes {
        platformTypes {
          id
          name
        }
      }`
  )
}

export async function graphQLDeviceProducts(options?: {
  includeHidden?: boolean
  size?: number
  from?: number
  after?: string
}) {
  return await graphQLBasicRequest(
    ` query DeviceProducts($includeHidden: Boolean, $size: Int, $from: Int, $after: ID) {
        deviceProducts(includeHidden: $includeHidden, size: $size, from: $from, after: $after) {
          items {
            id
            name
            platform { id name }
            scope
            status
            hidden
            created
            updated
            services {
              id
              name
              type { id name }
              port
              enabled
              platformCode
            }
          }
          total
          hasMore
          last
        }
      }`,
    options || {}
  )
}

export async function graphQLDeviceProduct(id: string) {
  return await graphQLBasicRequest(
    ` query DeviceProduct($id: ID!) {
        deviceProduct(id: $id) {
          id
          name
          platform { id name }
          scope
          status
          hidden
          created
          updated
          services {
            id
            name
            type { id name }
            port
            enabled
            platformCode
          }
        }
      }`,
    { id }
  )
}

export async function graphQLCreateDeviceProduct(input: {
  name: string
  platform: string
}) {
  return await graphQLBasicRequest(
    ` mutation CreateDeviceProduct($name: String!, $platform: String!) {
        createDeviceProduct(name: $name, platform: $platform) {
          id
          name
          platform { id name }
          scope
          status
          hidden
          created
          updated
          services {
            id
            name
            type { id name }
            port
            enabled
            platformCode
          }
        }
      }`,
    input
  )
}

export async function graphQLDeleteDeviceProduct(id: string) {
  return await graphQLBasicRequest(
    ` mutation DeleteDeviceProduct($id: ID!) {
        deleteDeviceProduct(id: $id)
      }`,
    { id }
  )
}

export async function graphQLUpdateDeviceProductSettings(
  id: string,
  input: { lock?: boolean; hidden?: boolean }
) {
  return await graphQLBasicRequest(
    ` mutation UpdateDeviceProductSettings($id: ID!, $input: DeviceProductSettingsInput!) {
        updateDeviceProductSettings(id: $id, input: $input) {
          id
          name
          platform { id name }
          scope
          status
          hidden
          created
          updated
          services {
            id
            name
            type { id name }
            port
            enabled
            platformCode
          }
        }
      }`,
    { id, input }
  )
}

export async function graphQLAddDeviceProductService(
  productId: string,
  input: { name: string; type: string; port: number; enabled: boolean }
) {
  return await graphQLBasicRequest(
    ` mutation AddDeviceProductService($productId: ID!, $name: String!, $type: String!, $port: Int!, $enabled: Boolean!) {
        addDeviceProductService(productId: $productId, name: $name, type: $type, port: $port, enabled: $enabled) {
          id
          name
          type { id name }
          port
          enabled
          platformCode
        }
      }`,
    { productId, ...input }
  )
}

export async function graphQLRemoveDeviceProductService(id: string) {
  return await graphQLBasicRequest(
    ` mutation RemoveDeviceProductService($id: ID!) {
        removeDeviceProductService(id: $id)
      }`,
    { id }
  )
}

