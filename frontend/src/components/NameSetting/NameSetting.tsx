import React from 'react'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { setConnection, connectionName } from '../../helpers/connectionHelper'
import { REGEX_CONNECTION_NAME, MAX_CONNECTION_NAME_LENGTH } from '../../shared/constants'

export const NameSetting: React.FC<{ service: IService; device?: IDevice; connection: IConnection }> = ({
  service,
  device,
  connection,
}) => {
  return (
    <InlineTextFieldSetting
      icon="i-cursor"
      value={connection.name}
      label="Connection Name"
      resetValue={connectionName(service, device)}
      disabled={connection.enabled || connection.public}
      filter={REGEX_CONNECTION_NAME}
      onSave={name =>
        connection &&
        setConnection({
          ...connection,
          name: name.toString().substr(0, MAX_CONNECTION_NAME_LENGTH) || connection.name,
        })
      }
    />
  )
}
