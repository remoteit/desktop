import React from 'react'
import { selectConnection } from '../selectors/connections'
import { ApplicationState } from '../store'
import { ConnectionListItem } from './ConnectionListItem'
import { isReverseProxy } from '../models/applicationTypes'
import { useSelector } from 'react-redux'
import { selectById } from '../selectors/devices'

export interface Props {
  serviceId: string
  session?: ISession
  network?: INetwork
  connectionsPage?: boolean
  fallbackName?: string
  children?: React.ReactNode
}

export const NetworkListItem: React.FC<Props> = ({
  network,
  serviceId,
  session,
  fallbackName,
  connectionsPage,
  children,
}) => {
  const { service, device, connection, reverseProxy } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, undefined, serviceId)
    const connection = selectConnection(state, service)
    const reverseProxy = isReverseProxy(state, service?.typeID)
    return { service, device, connection, reverseProxy }
  })

  const external = session?.id && session.id !== connection.sessionId
  const offline = service?.state !== 'active' && !external
  let pathname = `/networks/${network?.id}/${serviceId}`
  if (connectionsPage) pathname = `/connections/${serviceId}/${session?.id || 'none'}`
  const match = pathname
  pathname += connection && !session?.anonymous && !external ? '/connect' : '/other'

  return (
    <ConnectionListItem
      pathname={pathname}
      match={match}
      name={connection.name || session?.target.name || fallbackName || serviceId}
      enabled={connection.enabled || !!session}
      platform={device?.targetPlatform || session?.target.platform}
      offline={offline}
      anonymous={session?.anonymous}
      reverseProxy={reverseProxy}
      connected={!!session || !!connection.connected}
      connection={connection}
      connectionsPage={connectionsPage}
      networkEnabled={network?.enabled}
    >
      {children}
    </ConnectionListItem>
  )
}
