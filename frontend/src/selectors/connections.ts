import { isPortal } from '../services/Browser'
import { createSelector } from 'reselect'
import { DEFAULT_NETWORK } from '../models/networks'
import { newConnection } from '../helpers/connectionHelper'
import { getOwnDevices } from './devices'
import { selectActiveAccountId } from './accounts'
import { getUser, getOrganizations, getMemberships, getAllConnections, getSessions, optionalService } from './state'

export const getConnectionsLookup = createSelector([getAllConnections, selectActiveAccountId], (allConnections, accountId) =>
  allConnections.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
    if (!c.deviceID || accountId !== c.accountId) return lookup
    if (lookup[c.deviceID]) lookup[c.deviceID].push(c)
    else lookup[c.deviceID] = [c]
    return lookup
  }, {})
)

export const selectSessions = createSelector([getSessions, selectActiveAccountId], (sessions, accountId) => {
  return sessions.filter(s => s.target.accountId === accountId)
})

export const selectFetchConnections = createSelector([getAllConnections], connections => {
  return connections.filter(
    c => !!c.createdTime || c.enabled // && (!isPortal() || c.public || c.connectLink)
  )
})

export const selectConnections = createSelector(
  [getAllConnections, selectActiveAccountId],
  (connections, accountId) => {
    return connections.filter(
      c => c.accountId === accountId && (!!c.createdTime || c.enabled) //&& (!isPortal() || c.public || c.connectLink)
    )
  }
)

export const selectAllConnectionsCount = createSelector(
  [selectConnections, selectSessions],
  (connections, sessions) => {
    const enabled = connections.filter(connection => connection.online && connection.enabled).length
    return sessions.length + enabled
  }
)

export const selectConnectedConnections = createSelector([selectConnections], connections => {
  return connections.filter(connection => connection.online && connection.connected)
})

export const selectIdleConnections = createSelector([selectConnections], connections => {
  return connections.filter(connection => connection.enabled && connection.online && !connection.connected)
})

export const selectConnectionSessions = createSelector(
  [selectConnectedConnections, selectSessions, getUser],
  (connections, sessions, user) => {
    const active: ISession[] = connections
      .filter(c => c.connected && !sessions.find(s => s.target.id === c.id))
      .map(c => ({
        timestamp: new Date(c.startTime || 0),
        platform: 1, // FIXME this device state platform
        source: 'UNKNOWN',
        user: user,
        target: {
          id: c.id,
          accountId: c.accountId || user.id,
          deviceId: c.deviceID || '',
          platform: 1, // FIXME target device platform
          name: c.name || '', // FIXME target device name
        },
      }))
    return sessions.concat(active)
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
  [getUser, selectIdleConnections, getOrganizations, getMemberships],
  (user, connections, organizations, memberships): INetwork[] => {
    let networks: INetwork[] = []

    connections.forEach(c => {
      let accountId = c.accountId || ''

      const name = organizations[accountId]?.name || 'Personal'
      const owner = memberships.find(m => m.account.id === accountId)?.account || user
      const index = networks.findIndex(n => n.id === accountId)

      if (index === -1) networks.push({ ...DEFAULT_NETWORK, id: accountId, name, serviceIds: [c.id], owner })
      else networks[index].serviceIds.push(c.id)
    })

    return networks
  }
)
