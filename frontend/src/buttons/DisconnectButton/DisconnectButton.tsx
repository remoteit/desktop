import React from 'react'
import Controller from '../../services/Controller'
import { DynamicButton } from '../DynamicButton'

export const DisconnectButton: React.FC<{ disabled?: boolean; connection?: IConnection; fullSize?: boolean }> = ({
  disabled = false,
  fullSize = false,
  connection,
}) => {
  if (!connection || connection.connecting || !connection.active) return null

  return (
    <DynamicButton
      title="Disconnect"
      icon="ban"
      color="secondary"
      disabled={disabled}
      fullSize={fullSize}
      onClick={() => Controller.emit('service/disconnect', connection)}
    />
  )
}
