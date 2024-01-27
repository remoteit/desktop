import { DEFAULT_ID } from '../models/networks'
import { createSelector } from 'reselect'
import { getAllNetworks, optionalId } from './state'
import { selectActiveAccountId } from './accounts'

export const selectNetworks = createSelector(
  [selectActiveAccountId, getAllNetworks],
  (activeAccountId, allNetworks) => allNetworks[activeAccountId] || []
)

export const selectNetworkByService = createSelector(
  [selectNetworks, optionalId],
  (networks, serviceId = DEFAULT_ID): INetwork[] => networks.filter(network => network.serviceIds.includes(serviceId))
)
