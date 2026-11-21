import type { IDeviceProduct, IDeviceProductCode } from '../models/products'

export function registrationCodesToRetire(product: IDeviceProduct, revokePrevious = false): IDeviceProductCode[] {
  const inForce = product.registrationCodes?.filter(code => !code.revoked) ?? []
  if (product.joinKeys !== undefined) return revokePrevious ? inForce.slice(0, 1) : []
  return inForce.slice(revokePrevious ? 0 : 1)
}
