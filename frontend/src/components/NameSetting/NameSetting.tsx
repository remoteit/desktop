import React from 'react'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { attributeName } from '../../shared/nameHelper'
import { REGEX_NAME_SAFE } from '../../shared/constants'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const NameSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!service) return null
  if (!connection) connection = newConnection(service)

  const currentName = connection?.name || attributeName(service)

  return (
    <InlineTextFieldSetting
      value={currentName}
      label="Connection Name"
      resetValue={attributeName(service)}
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
