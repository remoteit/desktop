import React, { useState } from 'react'
import { REGEX_IP_SAFE, IP_PRIVATE, IP_OPEN } from '../../constants'
import { IService } from 'remote.it'
import { ResetButton } from '../../buttons/ResetButton'
import { InlineSetting } from '../InlineSetting'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { TextField } from '@material-ui/core'

export const HostSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const currentHost = connection && connection.host
  const [host, setHost] = useState(currentHost)

  if (!service) return null
  if (!connection) connection = newConnection(service, { host })

  const disabled = connection.active || service.state !== 'active'

  return (
    <InlineSetting
      value={host}
      label="Local IP Address"
      disabled={disabled}
      onCancel={() => setHost(currentHost)}
      onSave={() =>
        connection &&
        setConnection({
          ...connection,
          host: host || connection.host,
          restriction: IP_OPEN,
        })
      }
    >
      <TextField
        autoFocus
        label="Local IP Address"
        value={host}
        margin="dense"
        variant="filled"
        onChange={event => setHost(event.target.value.replace(REGEX_IP_SAFE, ''))}
      />
      <ResetButton onClick={() => setHost(IP_PRIVATE)} />
    </InlineSetting>
  )
}
