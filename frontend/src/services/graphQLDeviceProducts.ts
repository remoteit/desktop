import { graphQLBasicRequest } from './graphQL'

export async function graphQLPlatformTypes() {
  return await graphQLBasicRequest(
    ` query PlatformTypes {
        platformTypes {
          id
          name
          visible
        }
      }`
  )
}

export async function graphQLDeviceProducts(options?: {
  accountId?: string
  size?: number
  from?: number
  after?: string
}) {
  return await graphQLBasicRequest(
    ` query DeviceProducts($accountId: String, $size: Int, $from: Int, $after: ID) {
        login {
          account(id: $accountId) {
            deviceProducts(size: $size, from: $from, after: $after) {
              items {
                id
                name
                platform { id name }
                status
                registrationCode
                created
                updated
                services {
                  id
                  name
                  type { id name }
                  port
                  enabled
                }
              }
              total
              hasMore
              last
            }
          }
        }
      }`,
    options || {}
  )
}

export async function graphQLDeviceProduct(id: string, accountId?: string) {
  return await graphQLBasicRequest(
    ` query DeviceProduct($id: String!, $accountId: String) {
        login {
          account(id: $accountId) {
            deviceProducts(id: [$id]) {
              items {
                id
                name
                platform { id name }
                status
                registrationCode
                created
                updated
                services {
                  id
                  name
                  type { id name }
                  port
                  enabled
                }
              }
            }
          }
        }
      }`,
    { id, accountId }
  )
}

export async function graphQLCreateDeviceProduct(input: {
  name: string
  platform: string
  accountId?: string
}) {
  return await graphQLBasicRequest(
    ` mutation CreateDeviceProduct($accountId: String, $name: String!, $platform: String!) {
        createDeviceProduct(accountId: $accountId, name: $name, platform: $platform) {
          id
          name
          platform { id name }
          status
          registrationCode
          created
          updated
          services {
            id
            name
            type { id name }
            port
            enabled
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
  input: { lock?: boolean }
) {
  return await graphQLBasicRequest(
    ` mutation UpdateDeviceProductSettings($id: ID!, $input: DeviceProductSettingsInput!) {
        updateDeviceProductSettings(id: $id, input: $input) {
          id
          name
          platform { id name }
          status
          registrationCode
          created
          updated
          services {
            id
            name
            type { id name }
            port
            enabled
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

export async function graphQLTransferDeviceProduct(productId: string, email: string) {
  return await graphQLBasicRequest(
    ` mutation TransferDeviceProduct($productId: ID!, $email: String!) {
        transferDeviceProduct(productId: $productId, email: $email)
      }`,
    { productId, email }
  )
}
