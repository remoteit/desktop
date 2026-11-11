import { post } from './post'
import { graphQLBasicRequest, graphQLRequestWithReason, refusalOf } from './graphQL'

/* A product's maximum of devices (graphql-api docs/PROXY-GROUPS.md §11, "A product's maximum of devices"): optional, none
   by default. Every device of the product counts but a disabled one (devicesCounted). At the maximum, a device
   registering with any of the product's credentials is refused and tries again later, and no device is added, attached,
   kept or restored to it: a disabled one stays disabled — the expiry's restore at its sign-in too, and its page says why
   (Device.heldByProduct). Lowered below the devices it has, none is removed: none joins until removals or disables bring
   the count under. When it refuses a device with no one there to tell, its owner is told (PRODUCT_FULL: email, push, and
   the portal's own notification from the live event), the first time and then once a day at most; the email follows the
   account's productNotifications switch.

   Offered only where the API has it: the portal is released apart from graphql, and a query that named any of these on an
   API without it would fail whole — the product page, the device page, the notification settings, the live events. So
   each is read on its own, after a schema probe read once, as deviceDisable reads its own. */

export const MAX_DEVICES_CEILING = 1_000_000

export type ProductMaxDevices = { maxDevices: number | null; devicesCounted: number | null }

// What the API has of it: the maximum (the mutation and both product fields), a device's hold, the owner's mail switch,
// and the live event.
export type ProductCapServed = {
  maxDevices: boolean
  heldByProduct: boolean
  productNotifications: boolean
  event: boolean
}

const NONE: ProductCapServed = { maxDevices: false, heldByProduct: false, productNotifications: false, event: false }

let schema: Promise<ProductCapServed> | undefined

const PROBE = `query ProductMaxDevicesFields {
  mutation: __type(name: "Mutation") { fields { name } }
  product: __type(name: "DeviceProduct") { fields { name } }
  device: __type(name: "Device") { fields { name } }
  settings: __type(name: "NotificationSettings") { fields { name } }
  event: __type(name: "ProductFullEvent") { name }
}`

const has = (type: any, name: string) => !!type?.fields?.some((field: { name: string }) => field.name === name)

export function parseProductCapServed(data: any): ProductCapServed {
  return {
    maxDevices:
      has(data?.mutation, 'setDeviceProductMaxDevices') &&
      has(data?.product, 'maxDevices') &&
      has(data?.product, 'devicesCounted'),
    heldByProduct: has(data?.device, 'heldByProduct'),
    productNotifications: has(data?.settings, 'productNotifications'),
    event: data?.event?.name === 'ProductFullEvent',
  }
}

// Read once; asked again after a failed request.
export function productCapServed(): Promise<ProductCapServed> {
  if (!schema)
    schema = post({ query: PROBE }).then(response => {
      if (response === 'ERROR') {
        schema = undefined
        return NONE
      }
      return parseProductCapServed(response.data?.data)
    })
  return schema
}

// Whether the API has the maximum itself.
export async function productMaxDevicesServed(): Promise<boolean> {
  return (await productCapServed()).maxDevices
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

// Why a disabled device does not come back on: its product holds its maximum. Null for none; undefined where the API has
// no such word, or the read failed.
export async function graphQLHeldByProduct(deviceId: string, accountId?: string): Promise<string | null | undefined> {
  if (!(await productCapServed()).heldByProduct) return undefined
  const response = await graphQLBasicRequest(
    ` query HeldByProduct($accountId: String, $id: [String!]) {
        login {
          account(id: $accountId) {
            devices(disabled: true, id: $id) { items { id heldByProduct } }
          }
        }
      }`,
    { accountId, id: [deviceId] }
  )
  if (response === 'ERROR') return undefined
  const item = response.data?.data?.login?.account?.devices?.items?.[0]
  return typeof item?.heldByProduct === 'string' ? item.heldByProduct : null
}

// The account's switch for a product's mail when it refuses a device: true (on; none set is on), false, or undefined
// where the API has none or the read failed.
export async function graphQLProductNotifications(): Promise<boolean | undefined> {
  if (!(await productCapServed()).productNotifications) return undefined
  const response = await graphQLBasicRequest(
    ` query ProductNotifications { login { notificationSettings { productNotifications } } }`
  )
  if (response === 'ERROR') return undefined
  return response.data?.data?.login?.notificationSettings?.productNotifications !== false
}

// Set it alone: graphql keeps every other setting as it is when a write does not name it.
export async function setProductNotifications(on: boolean): Promise<boolean> {
  const response = await graphQLBasicRequest(
    ` mutation ProductNotifications($productNotifications: Boolean) {
        setNotificationSettings(productNotifications: $productNotifications)
      }`,
    { productNotifications: on }
  )
  return response !== 'ERROR'
}

// What the live events' subscription adds for the event, where the API has it: none otherwise, or the whole
// subscription would be refused.
export async function productFullEventFields(): Promise<string> {
  return (await productCapServed()).event
    ? `
          ... on ProductFullEvent {
            product
            productName
            maxDevices
            via
          }`
    : ''
}
