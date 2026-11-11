import { post } from './post'
import { graphQLBasicRequest, graphQLRequestWithReason, refusalOf } from './graphQL'

/* A product's maximum of devices (graphql-api docs/PROXY-GROUPS.md §11, "A product's maximum of devices"): optional, none
   by default. Every device of the product counts, disabled ones too, until it is removed (devicesCounted). At the
   maximum, a device registering with any of the product's credentials is refused and tries again later, and no device is
   added, kept or attached to it. Lowered below the devices it has, none is removed: none joins until removals bring the
   count under.

   Offered only where the API has it: the portal is released apart from graphql, and a product query that named
   maxDevices on an API without it would fail the whole product page. So it is read on its own, after a schema probe
   read once, as deviceDisable reads its own. */

export const MAX_DEVICES_CEILING = 1_000_000

export type ProductMaxDevices = { maxDevices: number | null; devicesCounted: number | null }

let schema: Promise<boolean> | undefined

const PROBE = `query ProductMaxDevicesFields {
  mutation: __type(name: "Mutation") { fields { name } }
  product: __type(name: "DeviceProduct") { fields { name } }
}`

const has = (type: any, name: string) => !!type?.fields?.some((field: { name: string }) => field.name === name)

// Whether the API has it: the mutation, and both of the product's fields.
export function parseProductMaxDevicesServed(data: any): boolean {
  return (
    has(data?.mutation, 'setDeviceProductMaxDevices') &&
    has(data?.product, 'maxDevices') &&
    has(data?.product, 'devicesCounted')
  )
}

// Read once; asked again after a failed request.
export function productMaxDevicesServed(): Promise<boolean> {
  if (!schema)
    schema = post({ query: PROBE }).then(response => {
      if (response === 'ERROR') {
        schema = undefined
        return false
      }
      return parseProductMaxDevicesServed(response.data?.data)
    })
  return schema
}

// For tests, and for a change of API or sign-in.
export function resetProductMaxDevices() {
  schema = undefined
}

const answer = (item: any): ProductMaxDevices => ({
  maxDevices: typeof item?.maxDevices === 'number' ? item.maxDevices : null,
  devicesCounted: typeof item?.devicesCounted === 'number' ? item.devicesCounted : null,
})

// The product's maximum and its count; undefined where the API has none, 'ERROR' where the read failed.
export async function graphQLProductMaxDevices(
  productId: string,
  accountId?: string
): Promise<ProductMaxDevices | 'ERROR' | undefined> {
  if (!(await productMaxDevicesServed())) return undefined
  const response = await graphQLBasicRequest(
    ` query ProductMaxDevices($id: String!, $accountId: String) {
        login {
          account(id: $accountId) {
            deviceProducts(id: [$id]) {
              items { id maxDevices devicesCounted }
            }
          }
        }
      }`,
    { id: productId, accountId }
  )
  if (response === 'ERROR') return 'ERROR'
  const item = response.data?.data?.login?.account?.deviceProducts?.items?.[0]
  return item ? answer(item) : 'ERROR'
}

// Set it, or remove it (null): the product as it is then, or graphql's refusal in its words ('' where it said none).
export async function setProductMaxDevices(
  productId: string,
  maxDevices: number | null
): Promise<{ product?: ProductMaxDevices; reason?: string }> {
  const result = await graphQLRequestWithReason(
    ` mutation SetDeviceProductMaxDevices($productId: ID!, $maxDevices: Int) {
        setDeviceProductMaxDevices(productId: $productId, maxDevices: $maxDevices) { id maxDevices devicesCounted }
      }`,
    { productId, maxDevices }
  )
  if (result === 'ERROR' || 'reason' in result) return { reason: refusalOf(result) ?? '' }
  return { product: answer(result.data?.data?.setDeviceProductMaxDevices) }
}

// What is typed: a whole number from 0 to the ceiling, or nothing for no maximum (null); undefined for anything else.
export function parseMaxDevices(typed: string): number | null | undefined {
  const value = typed.trim()
  if (!value) return null
  if (!/^\d+$/.test(value)) return undefined
  const max = Number(value)
  return max <= MAX_DEVICES_CEILING ? max : undefined
}

// How many devices the product holds past its maximum: 0 where it has none, or is within it.
export const devicesOver = ({ maxDevices, devicesCounted }: ProductMaxDevices): number =>
  maxDevices == null || devicesCounted == null ? 0 : Math.max(0, devicesCounted - maxDevices)
