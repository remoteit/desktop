import React from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

type ForgetButtonProps = {
  connection?: IConnection
  disabled?: boolean
}

export const ForgetButton: React.FC<ForgetButtonProps> = ({ disabled = false, connection }) => {
  if (!connection || connection.active) return null
  return (
    <Tooltip title="Clear this connection">
      <IconButton disabled={disabled} onClick={() => BackendAdaptor.emit('service/forget', connection)}>
        <Icon name="times" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
