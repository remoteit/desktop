import React from 'react'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { setConnection, connectionName } from '../../helpers/connectionHelper'
import { REGEX_CONNECTION_NAME } from '../../shared/constants'

export const NameSetting: React.FC<{ service: IService; device?: IDevice; connection: IConnection }> = ({
  service,
  device,
  connection,
}) => {
  return (
    <InlineTextFieldSetting
      icon="signature"
      value={connection.name}
      label="Connection Name"
      resetValue={connectionName(service, device)}
      disabled={connection.enabled}
      filter={REGEX_CONNECTION_NAME}
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
