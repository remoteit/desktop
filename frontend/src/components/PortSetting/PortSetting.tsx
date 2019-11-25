import React, { useState, useEffect } from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { Icon } from '../Icon'
import { IService } from 'remote.it'
import { useSelector } from 'react-redux'
import { InlineSetting } from '../InlineSetting'
import { REGEX_PORT_SAFE } from '../../constants'
import { ApplicationState } from '../../store'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { TextField, Tooltip, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

export const PortSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)
  const [port, setPort] = useState(connection && connection.port)
  const css = useStyles()

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
      icon="arrows-h"
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
        label="Port"
        value={port}
        margin="dense"
        variant="filled"
        onChange={event => setPort(+event.target.value.replace(REGEX_PORT_SAFE, ''))}
      />
      <Tooltip className={css.icon} title="Auto assign">
        <span>
          <IconButton
            onClick={() => {
              setPort(undefined)
              BackendAdaptor.emit('freePort', connection)
            }}
          >
            <Icon name="redo" color="grayDarker" size="md" weight="regular" fixedWidth />
          </IconButton>
        </span>
      </Tooltip>
    </InlineSetting>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1, marginLeft: spacing.md },
  icon: {
    margin: spacing.sm,
  },
})
