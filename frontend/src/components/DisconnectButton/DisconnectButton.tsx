import React from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'

export const DisconnectButton: React.FC<{ disabled?: boolean; connection?: IConnection }> = ({
  disabled = false,
  connection,
}) => {
  if (!connection || connection.connecting || !connection.active) return null
  return (
    <Tooltip title="Disconnect">
      <IconButton disabled={disabled} onClick={() => BackendAdaptor.emit('service/disconnect', connection)}>
        <Icon name="times" color="gray-darker" size="md" weight="regular" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
