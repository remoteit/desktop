import React, { useState } from 'react'
import { IService } from 'remote.it'
import { TextField } from '@material-ui/core'
import { ResetButton } from '../../buttons/ResetButton'
import { InlineSetting } from '../InlineSetting'
import { newConnection, setConnection } from '../../helpers/connectionHelper'

export const NameSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const currentName = (connection && connection.name) || (service && service.name)
  const [name, setName] = useState(currentName)

  if (!service) return null
  if (!connection) connection = newConnection(service, { name })

  return (
    <InlineSetting
      value={name}
      label="Connection Name"
      onCancel={() => setName(currentName)}
      onSave={() =>
        connection &&
        setConnection({
          ...connection,
          name: name || connection.name,
        })
      }
    >
      <TextField
        autoFocus
        fullWidth
        label="Connection Name"
        value={name}
        margin="dense"
        variant="filled"
        onChange={event => setName(event.target.value)}
      />
      <ResetButton onClick={() => setName(service.name)} />
    </InlineSetting>
  )
}
