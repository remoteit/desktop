import { DEFAULT_ID } from '../models/networks'
import { createSelector } from 'reselect'
import { getAllNetworks, optionalId } from './state'
import { selectRow } from './accounts'

// The networks of the row an account is looked at through: the selected row's where none is named.
export const selectNetworks = createSelector([selectRow, getAllNetworks], (row, allNetworks) => allNetworks[row] || [])

export const selectNetworkByService = createSelector(
  [selectNetworks, optionalId],
  (networks, serviceId = DEFAULT_ID): INetwork[] => networks.filter(network => network.serviceIds.includes(serviceId))
)
