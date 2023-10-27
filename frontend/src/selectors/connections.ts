import { createSelector } from 'reselect'
import { DEFAULT_NETWORK } from '../models/networks'
import { newConnection } from '../helpers/connectionHelper'
import { selectActiveAccountId, getActiveUser } from './accounts'
import { getUser, getAllConnections, getSessions, optionalService } from './state'

export const getConnectionsLookup = createSelector(
  [getAllConnections, selectActiveAccountId],
  (allConnections, accountId) =>
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

export const selectConnectionsByType = createSelector(
  [getActiveUser, selectIdleConnections],
  (activeUser, connections): INetwork[] => {
    const connection: IConnection | undefined = connections[0]

    const networks: INetwork[] = [
      {
        ...DEFAULT_NETWORK,
        cloud: true,
        id: 'public',
        name: 'Public',
        icon: 'globe',
        accountId: connection?.accountId || activeUser.id,
        serviceIds: [],
      },
      {
        ...DEFAULT_NETWORK,
        id: 'local',
        name: 'Local',
        icon: 'network-wired',
        accountId: connection?.accountId || activeUser.id,
        serviceIds: [],
      },
    ]

    connections.forEach(c => {
      if (c.public || c.connectLink) networks[0].serviceIds.push(c.id)
      else networks[1].serviceIds.push(c.id)
    })

    if (networks[0].serviceIds.length === 0) networks.shift()

    return networks
  }
)
