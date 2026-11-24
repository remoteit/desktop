import { createSelector } from 'reselect'
import { DEFAULT_NETWORK } from '../models/networks'
import { newConnection } from '../helpers/connectionHelper'
import { selectRow, selectActiveUser } from './accounts'
import { AccountRoute, selectAccountRoutes, selectActiveRowKey, subOf } from './signIns'
import { RowKey, rowAccount, rowKey, rowSub } from '../helpers/rowKey'
import { pickRecord } from '../helpers/connectionRecords'
import { getUser, getConnections, getSessions, optionalService } from './state'

/* A connection and a session belong to a ROW (helpers/rowKey): the account, and the sign-in it was made or read as.
   What is listed is the selected row's — the two rows of an organization two people here belong to each show their
   own. */
const inRow = (row: RowKey, routes: ILookup<AccountRoute>, accountId?: string, sub?: string) =>
  !!accountId && rowKey(accountId, subOf(routes, accountId, sub)) === row

export const getConnectionsLookup = createSelector(
  [getConnections, selectRow, selectAccountRoutes],
  (allConnections, row, routes) =>
    allConnections.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
      if (!c.deviceID || !inRow(row, routes, c.accountId, c.sub)) return lookup
      if (lookup[c.deviceID]) lookup[c.deviceID].push(c)
      else lookup[c.deviceID] = [c]
      return lookup
    }, {})
)

export const selectSessions = createSelector([getSessions, selectRow, selectAccountRoutes], (sessions, row, routes) => {
  return sessions.filter(s => inRow(row, routes, s.target.accountId, s.sub))
})

/* Every account's sessions, each as the row its account is looked at through has them: a session two rows of an
   organization both hold is one here, not two. */
export const selectLookedAtSessions = createSelector(
  [getSessions, selectAccountRoutes, selectActiveRowKey],
  (sessions, routes, active) =>
    sessions.filter(s => {
      const { accountId } = s.target
      const row = accountId === rowAccount(active) ? active : rowKey(accountId, routes[accountId]?.sub)
      return inRow(row, routes, accountId, s.sub)
    })
)

export const selectEnabledConnections = createSelector([getConnections], connections => {
  return connections.filter(c => !!c.createdTime || c.enabled)
})

export const selectConnections = createSelector(
  [getConnections, selectRow, selectAccountRoutes],
  (connections, row, routes) => {
    return connections.filter(c => inRow(row, routes, c.accountId, c.sub) && (!!c.createdTime || c.enabled))
  }
)

export const selectEnabledConnectionsCount = createSelector(
  [selectConnections, selectSessions],
  (connections, sessions) => {
    const enabled = connections.filter(
      connection => connection.online && connection.enabled && !sessions.find(s => s.target.id === connection.id)
    ).length
    return sessions.length + enabled
  }
)

export const selectConnectedConnections = createSelector([selectConnections], connections => {
  return connections.filter(connection => connection.online && connection.connected)
})

export const selectIdleConnections = createSelector([selectConnections], connections => {
  return connections.filter(connection => connection.enabled && connection.online && !connection.connected)
})

export const selectAllConnectionSessions = createSelector(
  [getConnections, selectLookedAtSessions, getUser],
  (connections, sessions, user) => {
    const active: ISession[] = connections
      // A session is its sign-in's, as a record is: each record pairs with its own.
      .filter(
        c => c.online && c.connected && !sessions.find(s => s.target.id === c.id && (s.sub ?? '') === (c.sub ?? ''))
      )
      .map(c => ({
        timestamp: new Date(c.startTime || 0),
        platform: 1, // FIXME this device state platform
        source: 'UNKNOWN',
        manufacturer: 'UNKNOWN',
        reverseProxy: false,
        user: user,
        sub: c.sub,
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

export const selectConnectionSessions = createSelector(
  [selectAllConnectionSessions, selectRow, selectAccountRoutes],
  (sessions, row, routes) => sessions.filter(s => inRow(row, routes, s.target.accountId, s.sub))
)

// A service's connection as the row looked at has it (helpers/connectionRecords): its own, never the other row's.
export const selectConnection = createSelector(
  [getConnections, optionalService, selectAccountRoutes, selectActiveRowKey],
  (connections, service: IService | undefined, routes, active) => {
    let connection = pickRecord(routes, connections, service?.id, rowAccount(active), rowSub(active))
    if (!connection?.typeID && service) return { ...newConnection(service), ...connection }
    if (!connection) return newConnection(service)
    return connection
  }
)

export const selectConnectionsByType = createSelector(
  [selectActiveUser, selectIdleConnections],
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
