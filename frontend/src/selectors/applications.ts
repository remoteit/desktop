import { createSelector } from 'reselect'
import { getApplication } from '../shared/applications'
import { getConnectionDefaults, getApplicationParams } from './state'

export const selectApplication = createSelector(
  [getConnectionDefaults, getApplicationParams],
  (globalDefaults, { service, connection }) => getApplication(service, connection, globalDefaults)
)
