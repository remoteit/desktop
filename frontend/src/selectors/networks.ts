import { createSelector } from 'reselect'
import { ApplicationState } from '../store'
import { getActiveAccountId } from './accounts'

const getAllNetworks = (state: ApplicationState) => state.networks.all

export const selectNetworks = createSelector(
  [getActiveAccountId, getAllNetworks],
  (activeAccountId, allNetworks) => allNetworks[activeAccountId] || []
)
