import { createSelector } from 'reselect'
import { getAllNetworks } from './state'
import { getActiveAccountId } from './accounts'

export const selectNetworks = createSelector(
  [getActiveAccountId, getAllNetworks],
  (activeAccountId, allNetworks) => allNetworks[activeAccountId] || []
)
