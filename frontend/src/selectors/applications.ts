import { createSelector } from 'reselect'
import { ApplicationState } from '../store'
import { getApplication } from '../shared/applications'

const getConnectionDefaults = (state: ApplicationState) => state.user.attributes?.connectionDefaults || {}
const getApplicationParams = (_: ApplicationState, service?: IService, connection?: IConnection) => ({
  service,
  connection,
})

export const selectApplication = createSelector(
  [getConnectionDefaults, getApplicationParams],
  (globalDefaults, { service, connection }) => getApplication(service, connection, globalDefaults)
)
