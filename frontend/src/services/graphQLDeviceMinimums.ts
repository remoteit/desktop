import { post } from './post'
import { UNSUPPORTED, withoutDeviceSessions } from './graphQLDaemon'

/* The oldest daemon build each kind of device may run (graphql's device-minimum resolver, services/device-minimums.ts):
   set by an admin, read for every device's agent (`supported`). A kind is how the device is brought up to date — its
   howToUpdate in lower case — or * for every kind without its own. An API without them answers UNSUPPORTED. */

export type DeviceMinimum = { kind: string; minimum: string; message?: string | null }

export { MINIMUM_KINDS } from './deviceMinimumKinds'

type Result<T> = T | 'ERROR' | typeof UNSUPPORTED

export async function graphQLDeviceMinimums(): Promise<Result<DeviceMinimum[]>> {
  const response = await post({ query: '{ deviceMinimums { kind minimum message } }' })
  if (response === 'ERROR') return 'ERROR'
  const errors = response.data?.errors
  if (withoutDeviceSessions(errors, 'deviceMinimums')) return UNSUPPORTED
  if (errors?.length) return 'ERROR'
  return response.data?.data?.deviceMinimums ?? []
}

// Sets a kind's minimum (a package or connectd version, or a date), or clears it (minimum empty). Answers what is set
// now, null once cleared, or the API's reason it refused — said to the admin as it is ("names no build: …").
export async function graphQLSetDeviceMinimum(
  kind: string,
  minimum: string,
  message: string
): Promise<{ set: DeviceMinimum | null } | { error: string }> {
  const response = await post({
    query: `mutation SetDeviceMinimum($kind: String!, $minimum: String, $message: String) {
      setDeviceMinimum(kind: $kind, minimum: $minimum, message: $message) { kind minimum message }
    }`,
    variables: { kind, minimum: minimum.trim() || null, message: message.trim() || null },
  })
  if (response === 'ERROR') return { error: 'The request failed' }
  const errors = response.data?.errors
  if (errors?.length)
    return {
      // graphql's UserError keeps its own sentence in extensions.message; message prefixes it ("Invalid Arguments: …").
      error: errors
        .map((e: { message?: string; extensions?: { message?: string } }) => e.extensions?.message || e.message)
        .filter(Boolean)
        .join('; '),
    }
  return { set: response.data?.data?.setDeviceMinimum ?? null }
}
