import { createSelector } from 'reselect'

const getAllConnections = state => state.connections.all

export const getConnectionsLookup = createSelector(getAllConnections, allConnections =>
  allConnections.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
    if (!c.deviceID) return lookup
    if (lookup[c.deviceID]) lookup[c.deviceID].push(c)
    else lookup[c.deviceID] = [c]
    return lookup
  }, {})
)
