import { createSelector } from 'reselect'
import { getApplication } from '@common/applications'
import {
  getConnectionDefaults,
  getApplicationService,
  getApplicationConnection,
  getApplicationTypes,
  getAllApplicationTypes,
  getEnvironment,
} from './state'
import { selectActiveAccountId } from './accounts'

// getApplication reads the types and environment through the adaptor; as inputs they drop stale results
export const selectApplication = createSelector(
  [getConnectionDefaults, getApplicationService, getApplicationConnection, getAllApplicationTypes, getEnvironment],
  (globalDefaults, service, connection) => getApplication(service, connection, globalDefaults)
)

export const selectApplicationTypesGrouped = createSelector(
  [getApplicationTypes, selectActiveAccountId],
  (applicationTypes, accountId): IApplicationTypeGroup[] => {
    const types = applicationTypes.account[accountId] || []

    const groupMap: { [key: number]: string } = applicationTypes.groups.reduce((map, group) => {
      group.ids.forEach(id => (map[id] = group.name))
      return map
    }, {})

    let result: IApplicationTypeGroup[] = []
    let processed = new Set<number>()

    types.forEach(obj => {
      if (groupMap[obj.id] && !processed.has(obj.id)) {
        // Find all objects in the same group
        const groupObjects = types.filter(o => groupMap[o.id] === groupMap[obj.id])

        // Add group object to result
        result.push({
          ...obj,
          name: groupMap[obj.id],
          ids: groupObjects.map(o => o.id),
        })

        // Mark these ids as processed
        groupObjects.forEach(o => processed.add(o.id))
      } else if (!groupMap[obj.id]) {
        // If not in a group, add it as is, but with ids as an array
        result.push({ ...obj, ids: [obj.id] })
      }
    })

    return result
  }
)
