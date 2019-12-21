import React from 'react'
import { IService } from 'remote.it'
import { InlineSetting } from '../InlineSetting'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

const SSH_TYPE = 28

export const UsernameSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!service || service.typeID !== SSH_TYPE) return null
  if (!connection) connection = newConnection(service)

  const currentUsername = connection && connection.username
  const disabled = service.state !== 'active'

  return (
    <InlineSetting
      value={currentUsername}
      label="SSH Username"
      disabled={disabled}
      onSave={username =>
        connection &&
        setConnection({
          ...connection,
          username: username.toString(),
        })
      }
    />
  )
}
