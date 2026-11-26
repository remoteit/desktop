import React from 'react'
import { selectConnection } from '../selectors/connections'
import { State } from '../store'
import { ConnectionListItem } from './ConnectionListItem'
import { useSelector } from 'react-redux'
import { selectById } from '../selectors/devices'
import { useKnownWebAddress, useWebAddress, useWebTarget } from '../hooks/useWebAddress'
import { WebServiceButton } from './WebServiceButton'

export interface NetworkListItemProps {
  serviceId: string
  session?: ISession
  network?: INetwork
  enabled?: boolean
  fallbackName?: string
  connectionsPage?: boolean
  children?: React.ReactNode
}

export const NetworkListItem: React.FC<NetworkListItemProps> = ({
  serviceId,
  session,
  network,
  enabled,
  fallbackName,
  connectionsPage,
  children,
}) => {
  const [service, device] = useSelector((state: State) => selectById(state, undefined, serviceId))
  const connection = useSelector((state: State) => selectConnection(state, service))
  // Opened at its web address (services/webAddress), and available once it has one: opened from its row, with no
  // connection to show.
  const target = useWebTarget(service, service && connection)
  const available = !!useKnownWebAddress(target, useWebAddress(service && target) === true)
  const external = !!session?.id && session.id !== connection.sessionId
  const offline = service?.state !== 'active' && !external
  const name = external ? session.target.name : connection.name || session?.target.name
  let to = `/networks/${network?.id}/${serviceId}`
  if (connectionsPage) to = `/connections/${serviceId}/${session?.id || 'none'}`
  const match = to
  to += connection && !external ? '/connect' : '/other'

  return (
    <ConnectionListItem
      to={to}
      match={match}
      name={name || fallbackName || serviceId}
      enabled={enabled}
      platform={device?.targetPlatform || session?.target.platform}
      offline={offline}
      manufacturer={session?.manufacturer}
      connected={!!session || !!connection.connected || connection.enabled}
      connection={external ? undefined : connection}
      connectionsPage={connectionsPage}
    >
      {available && target && !offline && !external && !connection.enabled && <WebServiceButton target={target} />}
      {children}
    </ConnectionListItem>
  )
}
