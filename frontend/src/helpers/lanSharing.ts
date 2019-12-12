import { IP_OPEN, IP_LATCH, IP_CLASS_A, IP_CLASS_B, IP_CLASS_C, IP_PRIVATE } from '../constants'

export function lanShareRestriction(connection?: IConnection) {
  if (!connection || connection.host !== IP_OPEN) return 'Off'

  switch (connection.restriction) {
    case undefined:
      return 'Off'
    case IP_OPEN:
      return 'No restriction'
    case IP_LATCH:
      return 'IP Latching'
    case IP_CLASS_A:
      return 'Class-A Local Restriction'
    case IP_CLASS_B:
      return 'Class-B Local Restriction'
    case IP_CLASS_C:
      return 'Class-C Local Restriction'
    default:
      return 'Single IP Restriction'
  }
}

export function lanShared(connection?: IConnection) {
  return !!(connection && connection.host === IP_OPEN)
}
