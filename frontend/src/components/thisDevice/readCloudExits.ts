import { graphQLDeviceExit, graphQLOfferedExits } from '../../services/graphQLExits'
import { CloudExits } from './cloudExits'

// What the account knows of the exits the machine's engine lists: each one's devices counted, as the exits offered for
// the device (or the person) say them, and the device of the machine's exit in use. Null where the API has neither.
// Apart from cloudExits.ts, which This device's parts import: they stay the bridge's, and the page (signed in) hands them
// this reader.
export async function readCloudExits(deviceId: string): Promise<CloudExits | null> {
  const [offered, uses] = await Promise.all([graphQLOfferedExits(deviceId), graphQLDeviceExit(deviceId)])
  const device = uses && typeof uses === 'object' ? uses : null
  if (!Array.isArray(offered) && !device) return null
  const serving = new Map(Array.isArray(offered) ? offered.map(exit => [exit.id, exit.serving]) : [])
  const exit = device?.usesExit
  if (exit && !serving.has(exit.id)) serving.set(exit.id, exit.serving)
  return {
    serving,
    inUse: exit ? { id: exit.id, through: device.usesExitThrough, serving: exit.serving } : null,
  }
}
