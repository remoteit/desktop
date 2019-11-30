import React from 'react'
import { hostName } from '../../helpers/nameHelper'
import { IService } from 'remote.it'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'

type Props = {
  connection?: IConnection
  service?: IService
}

const SSH_TYPE = 28

export const SSHButton: React.FC<Props> = ({ connection, service }) => {
  if (!connection || !connection.active) return null
  if (service && service.typeID !== SSH_TYPE) return null
  const url = `ssh://${connection.username || 'admin'}@${hostName(connection)}`
  return (
    <>
      <Tooltip title="Launch SSH">
        <IconButton onClick={() => window.open(url)}>
          <Icon name="terminal" size="md" fixedWidth />
        </IconButton>
      </Tooltip>
    </>
  )
}
