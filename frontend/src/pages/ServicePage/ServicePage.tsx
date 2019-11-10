import React, { useState } from 'react'
import { REGEX_PORT_SAFE } from '../../constants'
import { useParams, useHistory, useLocation } from 'react-router-dom'
import { setConnection, newConnection } from '../../helpers/connectionHelper'
import { useSelector } from 'react-redux'
import { findService } from '../../models/devices'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Typography, List, TextField } from '@material-ui/core'
import { LanShareSelect } from '../../components/LanShareSelect'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { DisconnectButton } from '../../components/DisconnectButton'
import { ConnectButton } from '../../components/ConnectButton'
import { ForgetButton } from '../../components/ForgetButton'
import { CopyButton } from '../../components/CopyButton'
import { makeStyles } from '@material-ui/styles'
import styles from '../../styling'

export const ServicePage: React.FC = () => {
  const { serviceID = '' } = useParams()
  let connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const freePort = useSelector((state: ApplicationState) => state.backend.freePort)
  const [port, setPort] = useState(freePort)
  const history = useHistory()
  const location = useLocation()
  const css = useStyles()

  if (!service) return null
  if (!connection) connection = newConnection(service, { port })

  return (
    <Breadcrumbs>
      <Typography variant="subtitle1">
        <ConnectionStateIcon connection={connection} service={service} size="lg" />
        <span className={css.title}>{service.name}</span>
        <CopyButton connection={connection} />
        <DisconnectButton connection={connection} />
        <ForgetButton connection={connection} />
        <ConnectButton connection={connection} />
      </Typography>
      <List>
        {/* Link to connection details */}
        <LanShareSelect onClick={() => history.push(location.pathname + '/lan')} serviceID={service.id} />
      </List>
      <section>
        <TextField
          label="Port"
          value={port}
          variant="filled"
          onChange={event => setPort(+event.target.value.replace(REGEX_PORT_SAFE, ''))}
          // onFocus={event => event.target.select()}
          helperText="Must be a unique number"
        />
      </section>
    </Breadcrumbs>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1, marginLeft: styles.spacing.md },
})
