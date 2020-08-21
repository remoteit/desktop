import React from 'react'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { REGEX_NAME_SAFE } from '../../shared/constants'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

const SSH_TYPE = 28

export const UsernameSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!service || service.typeID !== SSH_TYPE) return null
  if (!connection) connection = newConnection(service)

  const currentUsername = connection && connection.username
  const disabled = service.state !== 'active'

  return (
    <InlineTextFieldSetting
      value={currentUsername}
      label="SSH Username"
      disabled={disabled}
      filter={REGEX_NAME_SAFE}
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
