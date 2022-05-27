import React from 'react'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { setConnection, connectionName } from '../../helpers/connectionHelper'
import { REGEX_CONNECTION_NAME, MAX_CONNECTION_NAME_LENGTH } from '../../shared/constants'

export const NameSetting: React.FC<{ service: IService; device?: IDevice; connection: IConnection }> = ({
  service,
  device,
  connection,
}) => {
  const resetValue = connectionName(service, device)
  return (
    <InlineTextFieldSetting
      required
      modified={connection.name !== resetValue}
      icon="i-cursor"
      value={connection.name}
      label="Connection Name"
      resetValue={resetValue}
      disabled={connection.connected || connection.public}
      filter={REGEX_CONNECTION_NAME}
      maxLength={MAX_CONNECTION_NAME_LENGTH}
      onSave={name =>
        connection &&
        setConnection({
          ...connection,
          name: name.toString() || connection.name,
        })
      }
    />
  )
}
