import type { IDeviceProduct, IDeviceProductCode, IDeviceProductJoinKey } from '../models/products'

export type ProductOverview = {
  devices: number | null
  maxDevices: number | null
  joinKeys: Pick<IDeviceProductJoinKey, 'inForce'>[]
  oneTimeCodes: Pick<IDeviceProductCode, 'used' | 'revoked' | 'expires'>[]
  registrationCode: boolean
}

export type ProductIntake = 'accepting' | 'closed' | 'full'

const liveCode = (code: Pick<IDeviceProductCode, 'used' | 'revoked' | 'expires'>, now: Date) =>
  !code.revoked && (code.used ?? 0) < 1 && (!code.expires || new Date(code.expires) > now)

export function productIntake(overview: ProductOverview, now = new Date()): ProductIntake {
  if (overview.maxDevices != null && overview.devices != null && overview.devices >= overview.maxDevices) return 'full'
  if (overview.registrationCode) return 'accepting'
  if (overview.joinKeys.some(key => key.inForce)) return 'accepting'
  if (overview.oneTimeCodes.some(code => liveCode(code, now))) return 'accepting'
  return 'closed'
}

export function overviewOf(product: IDeviceProduct, counts?: { devices: number | null; maxDevices: number | null }) {
  return {
    devices: counts?.devices ?? null,
    maxDevices: counts?.maxDevices ?? null,
    joinKeys: product.joinKeys ?? [],
    oneTimeCodes: product.oneTimeCodes ?? [],
    registrationCode: !!product.registrationCode,
  }
}
