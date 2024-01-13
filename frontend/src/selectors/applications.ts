import { createSelector } from 'reselect'
import { getApplication } from '@common/applications'
import { getConnectionDefaults, getApplicationParams, getApplicationTypes } from './state'
import { selectActiveAccountId } from './accounts'

export const selectApplication = createSelector(
  [getConnectionDefaults, getApplicationParams],
  (globalDefaults, { service, connection }) => getApplication(service, connection, globalDefaults)
)

export const selectApplicationTypes = createSelector(
  [getApplicationTypes, selectActiveAccountId],
  (applicationTypes, accountId) => applicationTypes[accountId] || []
)
