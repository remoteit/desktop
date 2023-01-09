import { createSelector } from 'reselect'
import { ApplicationState } from '../store'
import { newConnection } from '../helpers/connectionHelper'

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

export const selectConnection = createSelector(
  [getAllConnections, optionalService],
  (connections, service?: IService) => {
    let connection = connections.find(c => c.id === service?.id)
    if (!connection?.typeID && service) return { ...newConnection(service), ...connection }
    if (!connection) return newConnection(service)
    return connection
  }
)
