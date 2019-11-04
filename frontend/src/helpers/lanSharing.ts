import { IP_OPEN, IP_LATCH, IP_CLASS_A, IP_CLASS_B, IP_CLASS_C } from '../constants'

export function lanShareRestriction(address: string) {
  switch (address) {
    case undefined:
      return 'Off'
    case IP_OPEN:
      return 'On'
    case IP_LATCH:
      return 'On - IP Latching'
    case IP_CLASS_A:
      return 'On - Class-A Local Restriction'
    case IP_CLASS_B:
      return 'On - Class-B Local Restriction'
    case IP_CLASS_C:
      return 'On - Class-C Local Restriction'
    default:
      return 'On - Single IP Restriction'
  }
}

export function lanShared(preference: boolean, connection: ConnectionInfo) {
  return !!(preference || connection.lanShare)
}
