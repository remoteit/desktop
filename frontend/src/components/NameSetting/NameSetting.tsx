import React from 'react'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { setConnection, connectionName } from '../../helpers/connectionHelper'
import { REGEX_NAME_SAFE } from '../../shared/constants'

export const NameSetting: React.FC<{ service: IService; device?: IDevice; connection: IConnection }> = ({
  service,
  device,
  connection,
}) => {
  return (
    <InlineTextFieldSetting
      value={connection.name}
      label="Connection Name"
      resetValue={connectionName(service, device)}
      filter={REGEX_NAME_SAFE}
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
