import React, { useState, useEffect } from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { IService } from 'remote.it'
import { useSelector } from 'react-redux'
import { ResetButton } from '../../buttons/ResetButton'
import { InlineSetting } from '../InlineSetting'
import { REGEX_PORT_SAFE } from '../../constants'
import { ApplicationState } from '../../store'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { TextField } from '@material-ui/core'

export const PortSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)
  const [port, setPort] = useState(connection && connection.port)

  useEffect(() => {
    if (port === undefined) setPort(freePort)
  }, [port, freePort])

  if (!service) return null
  if (!connection) connection = newConnection(service, { port })

  const disabled = connection.active || service.state !== 'active'

  return (
    <InlineSetting
      value={port}
      label="Port"
      disabled={disabled}
      onSave={() =>
        connection &&
        setConnection({
          ...connection,
          port: port || connection.port,
        })
      }
    >
      <TextField
        autoFocus
        label="Port"
        value={port}
        margin="dense"
        variant="filled"
        onChange={event => setPort(+event.target.value.replace(REGEX_PORT_SAFE, ''))}
      />
      <ResetButton
        onClick={() => {
          setPort(undefined)
          BackendAdaptor.emit('freePort', connection)
        }}
      />
    </InlineSetting>
  )
}
