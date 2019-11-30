import React from 'react'
import { IService } from 'remote.it'
import { hostName } from '../../helpers/nameHelper'
import { useLocation } from 'react-router-dom'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { ListItemLocation } from '../ListItemLocation'
import { DisconnectButton } from '../DisconnectButton'
import { ConnectButton } from '../ConnectButton'
import { BrowserButton } from '../BrowserButton'
import { ServiceName } from '../ServiceName'
import { CopyButton } from '../CopyButton'
import { Throughput } from '../Throughput'
import { makeStyles } from '@material-ui/styles'
import { SSHButton } from '../SSHButton'

export interface ServiceListItemProps {
  connection?: IConnection
  service?: IService
  nameType?: 'connection' | 'service'
}

export function ServiceListItem({ connection, service, nameType = 'service' }: ServiceListItemProps) {
  const location = useLocation()
  const css = useStyles()
  const id = connection ? connection.id : service ? service.id : ''
  return (
    <>
      <ListItemLocation pathname={`${location.pathname}/${id}`}>
        <ListItemIcon>
          <ConnectionStateIcon connection={connection} service={service} size="lg" />
        </ListItemIcon>
        <ListItemText
          primary={<ServiceName service={service} connection={connection} />}
          secondary={connection && hostName(connection)}
        />
        {connection && connection.active && <Throughput connection={connection} />}
        <ListItemSecondaryAction className={css.actions}>
          <BrowserButton connection={connection} />
          <SSHButton connection={connection} service={service} />
          <CopyButton connection={connection} />
          <DisconnectButton connection={connection} />
          <ConnectButton connection={connection} service={service} />
        </ListItemSecondaryAction>
      </ListItemLocation>
      {connection && <ConnectionErrorMessage connection={connection} />}
    </>
  )
}

const useStyles = makeStyles({
  actions: { right: 70, display: 'none' },
})
