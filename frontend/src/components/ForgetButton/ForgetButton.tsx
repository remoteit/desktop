import React from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'

type ForgetButtonProps = {
  connection?: IConnection
  disabled?: boolean
}

export const ForgetButton: React.FC<ForgetButtonProps> = ({ disabled = false, connection }) => {
  if (!connection || connection.active || connection.pid) return null
  return (
    <Tooltip title="Forget this connection">
      <IconButton disabled={disabled} onClick={() => BackendAdaptor.emit('service/forget', connection.id)}>
        <Icon name="times" color="gray" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
