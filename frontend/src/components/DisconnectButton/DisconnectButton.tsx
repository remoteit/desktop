import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import { DisconnectButtonControllerProps } from '../../controllers/DisconnectButtonController/DisconnectButtonController'

export function DisconnectButton({
  disconnect,
  service,
}: DisconnectButtonControllerProps) {
  return (
    <Tooltip title="Disconnect">
      <IconButton color="secondary" onClick={() => disconnect(service)}>
        <Icon name="trash-alt" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
