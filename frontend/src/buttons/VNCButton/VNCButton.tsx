import React from 'react'
import { hostName } from '../../helpers/nameHelper'
import { IService } from 'remote.it'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'

type Props = {
  connection?: IConnection
  service?: IService
}

const VNC_TYPE = 4

export const VNCButton: React.FC<Props> = ({ connection, service }) => {
  console.log('VNC BUTTON', service && service.typeID)
  if (!connection || !connection.active) return null
  if (service && service.typeID !== VNC_TYPE) return null

  return (
    <>
      <Tooltip title="Launch VNC">
        <IconButton onClick={() => window.open(`vnc://${hostName(connection)}`)}>
          <Icon name="desktop" size="md" fixedWidth />
        </IconButton>
      </Tooltip>
    </>
  )
}
