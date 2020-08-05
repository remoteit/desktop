import React from 'react'
import { InlineSetting } from '../InlineSetting'
import { REGEX_NAME_SAFE } from '../../shared/constants'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const NameSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)

  const currentName = (connection && connection.name) || (service && service.name)

  return (
    <InlineSetting
      value={currentName}
      label="Connection Name"
      resetValue={service.name}
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
