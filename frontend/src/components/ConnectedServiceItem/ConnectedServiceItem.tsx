import React from 'react'
import { IService } from 'remote.it'
import { useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { ApplicationState } from '../../store'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, IconButton } from '@material-ui/core'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { DisconnectButton } from '../DisconnectButton'
import { RestartButton } from '../RestartButton'
import { ConnectButton } from '../ConnectButton'
import { ForgetButton } from '../ForgetButton'
import { NextButton } from '../NextButton'
import { CopyButton } from '../CopyButton'
import { makeStyles } from '@material-ui/styles'
import { FIRST_PATH } from '../../helpers/regEx'

export interface ConnectedServiceItemProps {
  connection?: ConnectionInfo
  service?: IService
}

export function ConnectedServiceItem({ connection, service }: ConnectedServiceItemProps) {
  const history = useHistory()
  const location = useLocation()
  const devices = useSelector((state: ApplicationState) => state.devices.all)
  const css = useStyles()

  let state: ConnectionState = 'inactive'
  let connected: boolean = false
  let connecting: boolean = false
  let name: string = ''
  let port: number | undefined
  let error: boolean = false
  let match = location.pathname.match(FIRST_PATH)
  let path: string = match ? match[0] : '/'
  let id = ''

  if (connection) {
    connected = !!connection.pid
    connecting = !!connection.connecting
    error = !!connection.error
    port = connection.port
    name = connection.name
    id = connection.id
  }

  if (service) {
    connecting = connecting || !!service.connecting
    name = service.name
    state = service.state
    id = service.id
  }

  if (connected) state = 'connected'
  if (connecting) state = 'connecting'

  function click() {
    const device = devices.find(d => d.services.find(s => s.id === id))
    if (device) history.push(`${path}/${device.id}/${id}`)
  }

  return (
    <>
      <ListItem onClick={click} button>
        <ListItemIcon>
          <ConnectionStateIcon state={state} size="lg" />
        </ListItemIcon>
        <ListItemText primary={name} secondary={port && `localhost:${port}`} />
        <ListItemSecondaryAction className={css.actions}>
          <CopyButton show={!!port} title="Copy connection URL" text={`localhost:${port}`} />
          <DisconnectButton connection={connection} />
          <ForgetButton connection={connection} />
          <RestartButton connection={connection} />
          <ConnectButton service={service} connection={connection} />
        </ListItemSecondaryAction>
        <NextButton />
      </ListItem>
      {connection && error && <ConnectionErrorMessage connection={connection} />}
    </>
  )
}

const useStyles = makeStyles({ actions: { right: 60 } })
