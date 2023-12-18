import { useSelector } from 'react-redux'
import { selectNetworks } from '../selectors/networks'
import { getDeviceModel } from '../selectors/devices'
import { ApplicationState } from '../store'
import { selectAnnouncements } from '../models/announcements'
import { selectEnabledConnectionsCount } from '../selectors/connections'
import { selectConnectionSessions } from '../selectors/connections'

export function useCounts() {
  const { unreadAnnouncements, connections, networks, active, devices, memberships } = useSelector(
    (state: ApplicationState) => ({
      unreadAnnouncements: selectAnnouncements(state, true).length,
      connections: selectEnabledConnectionsCount(state),
      networks: selectNetworks(state).length,
      active: selectConnectionSessions(state).length,
      devices: getDeviceModel(state).total,
      memberships: state.accounts.membership.length,
    })
  )

  return { unreadAnnouncements, connections, networks, active, devices, memberships }
}
