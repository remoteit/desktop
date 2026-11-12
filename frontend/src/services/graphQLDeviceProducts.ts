import { graphQLBasicRequest } from './graphQL'

const SERVICE_FIELDS = 'id name type { id name } host port enabled'

export type ProductServiceInput = { name: string; type: string; host?: string; port: number; enabled: boolean }
export type ProductRegistrationService = { application: number; name?: string; host?: string; port?: number; enabled?: boolean }

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
                registrationCommand
                tags
                source
                created
                updated
                services { ${SERVICE_FIELDS} }
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
                registrationCommand
                registrationCodes {
                  code
                  created
                  revoked
                }
                tags
                source
                created
                updated
                services { ${SERVICE_FIELDS} }
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
          services { ${SERVICE_FIELDS} }
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
          services { ${SERVICE_FIELDS} }
        }
      }`,
    { id, input }
  )
}

export async function graphQLAddDeviceProductService(
  productId: string,
  input: ProductServiceInput
) {
  return await graphQLBasicRequest(
    ` mutation AddDeviceProductService($productId: ID!, $name: String!, $type: String!, $host: String, $port: Int!, $enabled: Boolean!) {
        addDeviceProductService(productId: $productId, name: $name, type: $type, host: $host, port: $port, enabled: $enabled) { ${SERVICE_FIELDS} }
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

export async function graphQLRotateDeviceProductCode(productId: string, revokePrevious = false) {
  return await graphQLBasicRequest(
    ` mutation RotateDeviceProductCode($productId: ID!, $revokePrevious: Boolean) {
        rotateDeviceProductCode(productId: $productId, revokePrevious: $revokePrevious) {
          code
          created
          revoked
        }
      }`,
    { productId, revokePrevious }
  )
}

export async function graphQLRevokeDeviceProductCode(productId: string, code: string) {
  return await graphQLBasicRequest(
    ` mutation RevokeDeviceProductCode($productId: ID!, $code: String!) {
        revokeDeviceProductCode(productId: $productId, code: $code) {
          code
          created
          revoked
        }
      }`,
    { productId, code }
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

export async function graphQLCreateDeviceProductFromRegistration(props: {
  platform: number
  tags?: string[]
  services: ProductRegistrationService[]
  accountId?: string
  name?: string
}) {
  const { accountId, ...input } = props
  return await graphQLBasicRequest(
    ` mutation CreateDeviceProductFromRegistration($accountId: String, $input: CreateDeviceProductFromRegistrationInput!) {
        createDeviceProductFromRegistration(accountId: $accountId, input: $input) {
          id
          name
          platform { id name }
          status
          tags
          source
          registrationCode
          registrationCommand
          created
          updated
          services { ${SERVICE_FIELDS} }
        }
      }`,
    { accountId, input }
  )
}

export async function graphQLUpdateDeviceProduct(
  id: string,
  input: { name?: string; platform?: number; tags?: string[] }
) {
  return await graphQLBasicRequest(
    ` mutation UpdateDeviceProduct($id: ID!, $input: UpdateDeviceProductInput!) {
        updateDeviceProduct(id: $id, input: $input) {
          id
          name
          platform { id name }
          status
          tags
          source
          registrationCode
          registrationCommand
          created
          updated
          services { ${SERVICE_FIELDS} }
        }
      }`,
    { id, input }
  )
}
