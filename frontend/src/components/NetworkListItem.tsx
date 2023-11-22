import React from 'react'
import { selectConnection } from '../selectors/connections'
import { ApplicationState } from '../store'
import { ConnectionListItem } from './ConnectionListItem'
import { isReverseProxy } from '../models/applicationTypes'
import { useSelector } from 'react-redux'
import { selectById } from '../selectors/devices'

export interface NetworkListItemProps {
  serviceId: string
  session?: ISession
  network?: INetwork
  connectionsPage?: boolean
  fallbackName?: string
  children?: React.ReactNode
}

export const NetworkListItem: React.FC<NetworkListItemProps> = ({
  network,
  serviceId,
  session,
  fallbackName,
  connectionsPage,
  children,
}) => {
  const { service, device, connection } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, undefined, serviceId)
    const connection = selectConnection(state, service)
    return { service, device, connection }
  })

  const external = session?.id && session.id !== connection.sessionId
  const offline = service?.state !== 'active' && !external
  const name = external ? session.target.name : connection.name || session?.target.name
  let pathname = `/networks/${network?.id}/${serviceId}`
  if (connectionsPage) pathname = `/connections/${serviceId}/${session?.id || 'none'}`
  const match = pathname
  pathname += connection && !external ? '/connect' : '/other'

  return (
    <ConnectionListItem
      pathname={pathname}
      match={match}
      name={name || fallbackName || serviceId}
      enabled={connection.enabled || !!session}
      platform={device?.targetPlatform || session?.target.platform}
      offline={offline}
      manufacturer={session?.manufacturer}
      connected={!!session || !!connection.connected}
      connection={external ? undefined : connection}
      connectionsPage={connectionsPage}
    >
      {children}
    </ConnectionListItem>
  )
}
