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
      <IconButton
        color="secondary"
        className="txt-md"
        onClick={() => disconnect(service)}
      >
        <Icon name="times" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
