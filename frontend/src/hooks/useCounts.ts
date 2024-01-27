import { State } from '../store'
import { useSelector } from 'react-redux'
import { selectNetworks } from '../selectors/networks'
import { getDeviceModel } from '../selectors/devices'
import { selectAnnouncements } from '../selectors/announcements'
import { selectConnectionSessions } from '../selectors/connections'
import { selectEnabledConnectionsCount } from '../selectors/connections'

export function useCounts() {
  const unreadAnnouncements = useSelector((state: State) => selectAnnouncements(state, true).length)
  const connections = useSelector(selectEnabledConnectionsCount)
  const networks = useSelector(selectNetworks).length
  const active = useSelector(selectConnectionSessions).length
  const devices = useSelector(getDeviceModel).total
  const memberships = useSelector((state: State) => state.accounts.membership.length)
  return { unreadAnnouncements, connections, networks, active, devices, memberships }
}
