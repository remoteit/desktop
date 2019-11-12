import React, { useState, useEffect } from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { REGEX_PORT_SAFE } from '../../constants'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import { newConnection } from '../../helpers/connectionHelper'
import { useSelector } from 'react-redux'
import { findService } from '../../models/devices'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Icon } from '../../components/Icon'
import { Typography, List, TextField, Tooltip, IconButton } from '@material-ui/core'
import { LanShareSelect } from '../../components/LanShareSelect'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { DisconnectButton } from '../../components/DisconnectButton'
import { ConnectButton } from '../../components/ConnectButton'
// import { ForgetButton } from '../../components/ForgetButton'
// import { CopyButton } from '../../components/CopyButton'
import { makeStyles } from '@material-ui/styles'
import { spacing } from '../../styling'

export const ServicePage: React.FC = () => {
  const { serviceID = '' } = useParams()
  let connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)
  const [port, setPort] = useState((connection && connection.port) || freePort)
  const history = useHistory()
  const location = useLocation()
  const css = useStyles()

  useEffect(() => {
    if (port === undefined) setPort(freePort)
  }, [port, freePort])

  if (!service) return null
  if (!connection) connection = newConnection(service, { port })
  connection.port = port

  return (
    <Breadcrumbs>
      <Typography variant="subtitle1">
        <ConnectionStateIcon connection={connection} service={service} size="lg" />
        <span className={css.title}>{service.name}</span>
        <DisconnectButton connection={connection} />
        <ConnectButton connection={connection} />
      </Typography>
      <List>
        {/* Link to connection details */}
        <LanShareSelect onClick={() => history.push(location.pathname + '/lan')} serviceID={service.id} />
      </List>
      <div className={css.indent}>
        <TextField
          label="Port"
          value={port}
          variant="filled"
          onChange={event => setPort(+event.target.value.replace(REGEX_PORT_SAFE, ''))}
          helperText="Must be a unique number"
        />
        <Tooltip title="Auto assign">
          <IconButton
            disabled={connection.active}
            onClick={() => {
              setPort(undefined)
              BackendAdaptor.emit('freePort', connection)
            }}
          >
            <Icon name="redo" color="gray-darker" size="md" weight="regular" fixedWidth />
          </IconButton>
        </Tooltip>
      </div>
    </Breadcrumbs>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1, marginLeft: spacing.md },
  indent: {
    margin: `${spacing.md}px 65px`,
    '& .MuiIconButton-root': {
      margin: spacing.sm,
    },
  },
})
