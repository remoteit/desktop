import React from 'react'
import Controller from '../../services/Controller'
import { IService } from 'remote.it'
import { newConnection } from '../../helpers/connectionHelper'
import { DynamicButton } from '../DynamicButton'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
  fullSize?: boolean
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ connection, service, fullSize }) => {
  if ((connection && connection.active) || !service || service.state !== 'active') return null

  const disabled: boolean = !!(connection && connection.connecting)
  const connect = () => Controller.emit('service/connect', connection || newConnection(service))

  return (
    <DynamicButton
      title="Connect"
      icon="exchange"
      color="primary"
      disabled={disabled}
      fullSize={fullSize}
      onClick={connect}
    />
  )
}
