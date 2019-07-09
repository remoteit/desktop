import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import { DisconnectButtonControllerProps } from '../../controllers/DisconnectButtonController/DisconnectButtonController'

export function DisconnectButton({
  disconnect,
  disabled = false,
  id,
}: DisconnectButtonControllerProps) {
  return (
    <Tooltip title="Disconnect">
      <IconButton
        color="secondary"
        className="txt-md"
        disabled={disabled}
        onClick={() => disconnect(id)}
      >
        <Icon name="stop-circle" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
