import { createSelector } from 'reselect'
import { getAllNetworks } from './state'
import { selectActiveAccountId } from './accounts'

export const selectNetworks = createSelector(
  [selectActiveAccountId, getAllNetworks],
  (activeAccountId, allNetworks) => allNetworks[activeAccountId] || []
)
