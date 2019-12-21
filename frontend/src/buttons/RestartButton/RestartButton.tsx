import React from 'react'
import Controller from '../../services/Controller'
import { Dispatch } from '../../store'
import { Tooltip, IconButton } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { Icon } from '../../components/Icon'

export type RestartButtonProps = {
  connection?: IConnection
  disabled?: boolean
}

export const RestartButton: React.FC<RestartButtonProps> = ({ disabled = false, connection }) => {
  const dispatch = useDispatch<Dispatch>()
  if (!connection || connection.connecting || connection.pid) return null
  return (
    <Tooltip title="Re-connect">
      <span>
        <IconButton
          disabled={disabled}
          color="primary"
          onClick={() => console.warn("unimplemented Controller.emit('service/restart', connection)")}
        >
          <Icon name="redo" size="md" weight="regular" fixedWidth />
        </IconButton>
      </span>
    </Tooltip>
  )
}
