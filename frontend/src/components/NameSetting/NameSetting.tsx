import React, { useState } from 'react'
import { IService } from 'remote.it'
import { TextField } from '@material-ui/core'
import { ResetButton } from '../../buttons/ResetButton'
import { InlineSetting } from '../InlineSetting'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const NameSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  if (!service) return null
  if (!connection) connection = newConnection(service, {})

  const currentName = (connection && connection.name) || (service && service.name)

  return (
    <InlineSetting
      value={currentName}
      label="Connection Name"
      // onCancel={() => setName(currentName)}
      resetValue={service.name}
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
