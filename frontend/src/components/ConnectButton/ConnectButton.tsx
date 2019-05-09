import React from 'react'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'
import { ConnectButtonControllerProps } from '../../controllers/ConnectButtonController/ConnectButtonController'

export function ConnectButton({
  connect,
  service,
}: ConnectButtonControllerProps) {
  return (
    <Tooltip title="Connect">
      <IconButton
        disabled={service.connecting}
        color="primary"
        className="txt-md"
        onClick={() => connect(service)}
      >
        <Icon name="plug" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
