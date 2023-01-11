import React from 'react'
import { selectConnection } from '../selectors/connections'
import { ApplicationState } from '../store'
import { ConnectionListItem } from './ConnectionListItem'
import { useSelector } from 'react-redux'
import { selectById } from '../selectors/devices'

export interface Props {
  serviceId: string
  session?: ISession
  network?: INetwork
  connectionsPage?: boolean
  fallbackName?: string
  external?: boolean
  children?: React.ReactNode
}

export const NetworkListItem: React.FC<Props> = ({
  network,
  serviceId,
  session,
  fallbackName,
  external,
  connectionsPage,
  children,
}) => {
  const { service, device, connection } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, undefined, serviceId)
    const connection = selectConnection(state, service)
    return { service, device, connection }
  })

  let pathname = `/networks/${network?.id}/${serviceId}`
  if (connectionsPage) pathname = `/connections/${serviceId}/${session?.id || 'none'}`
  const match = pathname
  pathname += '/connect'

  return (
    <ConnectionListItem
      pathname={pathname}
      match={match}
      name={connection.name || session?.target.name || fallbackName || serviceId}
      enabled={connection.enabled}
      platform={device?.targetPlatform || session?.target.platform}
      offline={service?.state !== 'active' && !external}
      connected={session ? session.state === 'connected' : !!connection.connected}
      connection={connection}
      connectionsPage={connectionsPage}
      networkEnabled
    >
      {children}
    </ConnectionListItem>
  )
}
