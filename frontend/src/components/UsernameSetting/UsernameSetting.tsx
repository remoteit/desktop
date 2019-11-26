import React, { useState } from 'react'
import { IService } from 'remote.it'
import { InlineSetting } from '../InlineSetting'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { TextField } from '@material-ui/core'

const SSH_TYPE = 28

export const UsernameSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const [username, setName] = useState(connection && connection.username)

  if (!service || service.typeID !== SSH_TYPE) return null
  if (!connection) connection = newConnection(service, { username })

  const disabled = connection.active || service.state !== 'active'

  return (
    <InlineSetting
      value={username}
      label="SSH Username"
      disabled={disabled}
      onSave={() =>
        connection &&
        setConnection({
          ...connection,
          username: username || connection.username,
        })
      }
    >
      <TextField
        autoFocus
        label="SSH Username"
        value={username}
        margin="dense"
        variant="filled"
        onChange={event => setName(event.target.value)}
      />
    </InlineSetting>
  )
}
