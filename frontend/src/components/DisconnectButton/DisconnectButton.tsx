import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Dispatch } from '../../store'
import { useDispatch } from 'react-redux'
import { Icon } from '../Icon'

export const DisconnectButton: React.FC<{ disabled?: boolean; connection?: IConnection }> = ({
  disabled = false,
  connection,
}) => {
  const dispatch = useDispatch<Dispatch>()
  if (!connection || connection.connecting || !connection.pid) return null
  return (
    <Tooltip title="Disconnect">
      <IconButton disabled={disabled} onClick={() => dispatch.devices.disconnect(connection.id)}>
        <Icon name="times" color="gray-darker" size="md" weight="regular" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
