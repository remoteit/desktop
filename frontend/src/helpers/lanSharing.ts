import { IP_OPEN, IP_LATCH } from '../constants'
import { store } from '../store'

export function lanShareRestriction(connection?: IConnection) {
  if (!connection || connection.host !== IP_OPEN) return 'Off'
  const { privateIP } = store.getState().backend

  if (connection.restriction === undefined) return 'Off'
  if (connection.restriction === IP_OPEN) return 'No restriction'
  if (connection.restriction === IP_LATCH) return 'IP Latching'
  if (isIPClass(connection.restriction, privateIP, 'A')) return 'Class-A Restriction'
  if (isIPClass(connection.restriction, privateIP, 'B')) return 'Class-B Restriction'
  if (isIPClass(connection.restriction, privateIP, 'C')) return 'Class-C Restriction'
  return 'Single IP Restriction'
}

export function lanShared(connection?: IConnection) {
  return !!(connection && connection.host === IP_OPEN)
}

export function isIPClass(checkIP: ipAddress, privateIP: ipAddress, type: ipClass) {
  const maskedIP = maskIPClass(privateIP, type)
  return checkIP === maskedIP
}

// IP class-A: *.0.0.0
// IP class-B: *.*.0.0
// IP class-C: *.*.*.0
export function maskIPClass(privateIP: ipAddress, type: ipClass) {
  let parts = privateIP.split('.')
  switch (type) {
    case 'A':
      parts[1] = '0'
    case 'B':
      parts[2] = '0'
    case 'C':
      parts[3] = '0'
  }
  return parts.join('.')
}
