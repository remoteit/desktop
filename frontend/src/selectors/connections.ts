import { isPortal } from '../services/Browser'
import { createSelector } from 'reselect'
import { ApplicationState } from '../store'
import { DEFAULT_NETWORK } from '../models/networks'
import { newConnection } from '../helpers/connectionHelper'
import { getOwnDevices } from './devices'
import { getAccounts } from './organizations'
import { getUserId } from './accounts'

const getAllConnections = (state: ApplicationState) => state.connections.all
const optionalService = (_: ApplicationState, service?: IService) => service

export const getConnectionsLookup = createSelector(getAllConnections, allConnections =>
  allConnections.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
    if (!c.deviceID) return lookup
    if (lookup[c.deviceID]) lookup[c.deviceID].push(c)
    else lookup[c.deviceID] = [c]
    return lookup
  }, {})
)

export const selectConnections = createSelector([getAllConnections], connections => {
  return connections.filter(c => (!!c.createdTime || c.enabled) && (!isPortal() || c.public || c.connectLink))
})

export const selectEnabledConnections = createSelector([selectConnections], connections => {
  return connections.filter(connection => connection.enabled)
})

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
  [getUserId, getOwnDevices, selectEnabledConnections, getAccounts],
  (userId, devices, connections, accounts): INetwork[] => {
    const ownDeviceIds = devices.filter(d => !d.hidden).map(d => d.id)
    let networks: INetwork[] = []

    connections.forEach(c => {
      let accountId = c.accountId || ''

      // own device
      if (ownDeviceIds.includes(c.deviceID || '')) accountId = userId
      // org device
      else if (c.owner?.id && accounts[c.owner.id]) accountId = c.owner.id

      const name = accounts[accountId]?.name || 'Unknown'
      const index = networks.findIndex(n => n.id === accountId)

      if (index === -1) networks.push({ ...DEFAULT_NETWORK, id: accountId, name, serviceIds: [c.id] })
      else networks[index].serviceIds.push(c.id)
    })

    return networks
  }
)
