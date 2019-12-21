import React from 'react'
import Controller from '../../services/Controller'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const DisconnectButton: React.FC<{ disabled?: boolean; connection?: IConnection }> = ({
  disabled = false,
  connection,
}) => {
  if (!connection || connection.connecting || !connection.active) return null
  return (
    <Tooltip title="Disconnect">
      <span>
        <IconButton disabled={disabled} onClick={() => Controller.emit('service/disconnect', connection)}>
          <Icon name="ban" color="danger" size="md" weight="regular" fixedWidth />
        </IconButton>
      </span>
    </Tooltip>
  )
}
