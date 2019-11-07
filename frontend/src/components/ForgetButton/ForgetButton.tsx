import React from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { Dispatch } from '../../store'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import { useDispatch } from 'react-redux'

type ForgetButtonProps = {
  connection?: IConnection
  disabled?: boolean
}

export const ForgetButton: React.FC<ForgetButtonProps> = ({ disabled = false, connection }) => {
  const dispatch = useDispatch<Dispatch>()
  if (!connection || connection.connecting || connection.pid) return null
  return (
    <Tooltip title="Forget this connection">
      <IconButton disabled={disabled} onClick={() => BackendAdaptor.emit('service/forget', connection.id)}>
        <Icon name="times" color="gray" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
