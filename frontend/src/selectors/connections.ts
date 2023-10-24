import { isPortal } from '../services/Browser'
import { createSelector } from 'reselect'
import { DEFAULT_NETWORK } from '../models/networks'
import { newConnection } from '../helpers/connectionHelper'
import { getOwnDevices } from './devices'
import { getActiveAccountId } from './accounts'
import { getUser, getOrganizations, getMemberships, getAllConnections, getSessions, optionalService } from './state'

export const getConnectionsLookup = createSelector(
  [getAllConnections, getActiveAccountId],
  (allConnections, accountId) =>
    allConnections.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
      if (!c.deviceID || accountId !== c.accountId) return lookup
      if (lookup[c.deviceID]) lookup[c.deviceID].push(c)
      else lookup[c.deviceID] = [c]
      return lookup
    }, {})
)

export const selectSessions = createSelector([getSessions, getActiveAccountId], (sessions, accountId) => {
  return sessions.filter(s => s.target.accountId === accountId)
})

export const selectConnections = createSelector([getAllConnections, getActiveAccountId], (connections, accountId) => {
  return connections.filter(
    c => c.accountId === accountId && (!!c.createdTime || c.enabled) && (!isPortal() || c.public || c.connectLink)
  )
})

export const selectEnabledConnections = createSelector([selectConnections], connections => {
  return connections.filter(connection => connection.online && connection.enabled)
})

export const selectActiveConnectionIds = createSelector(
  [selectEnabledConnections, selectSessions],
  (connections, sessions) => {
    const sessionServiceIds = sessions.map(s => s.target.id)
    const connected = connections.filter(c => c.connected && !sessionServiceIds.includes(c.id)).map(c => c.id)
    return sessionServiceIds.concat(connected)
  }
)

export const selectConnection = createSelector(
  [getAllConnections, optionalService],
  (connections, service?: IService) => {
    let connection = connections.find(c => c.id === service?.id)
    if (!connection?.typeID && service) return { ...newConnection(service), ...connection }
    if (!connection) return newConnection(service)
    return connection
  }
)

export const selectConnectionsByAccount = createSelector(
  [getUser, getOwnDevices, selectEnabledConnections, getOrganizations, getMemberships],
  (user, devices, connections, organizations, memberships): INetwork[] => {
    const ownDeviceIds = devices.filter(d => !d.hidden).map(d => d.id)
    let networks: INetwork[] = []

    connections.forEach(c => {
      let accountId = c.accountId || ''

      // own device
      if (ownDeviceIds.includes(c.deviceID || '')) accountId = user.id
      // org device
      else if (c.owner?.id && organizations[c.owner.id]) accountId = c.owner.id

      const name = organizations[accountId]?.name || 'Personal'
      const owner = memberships.find(m => m.account.id === accountId)?.account || user
      const index = networks.findIndex(n => n.id === accountId)

      if (index === -1) networks.push({ ...DEFAULT_NETWORK, id: accountId, name, serviceIds: [c.id], owner })
      else networks[index].serviceIds.push(c.id)
    })

    return networks
  }
)
