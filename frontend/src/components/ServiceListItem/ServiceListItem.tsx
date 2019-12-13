import React from 'react'
import { IService } from 'remote.it'
import { hostName } from '../../helpers/nameHelper'
import { useLocation } from 'react-router-dom'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { ListItemLocation } from '../ListItemLocation'
import { DisconnectButton } from '../../buttons/DisconnectButton'
import { ConnectButton } from '../../buttons/ConnectButton'
import { BrowserButton } from '../../buttons/BrowserButton'
import { ServiceName } from '../ServiceName'
import { CopyButton } from '../../buttons/CopyButton'
import { Throughput } from '../Throughput'
import { makeStyles } from '@material-ui/styles'
import { SSHButton } from '../../buttons/SSHButton'
import { VNCButton } from '../../buttons/VNCButton'
import { colors } from '../../styling'
import { lanShareRestriction, lanShared } from '../../helpers/lanSharing'

export interface ServiceListItemProps {
  connection?: IConnection
  service?: IService
  nameType?: 'connection' | 'service'
}

export function ServiceListItem({ connection, service, nameType = 'service' }: ServiceListItemProps) {
  const location = useLocation()
  const css = useStyles()
  const id = connection ? connection.id : service ? service.id : ''
  const details = (
    <>
      {connection && hostName(connection)}
      {lanShared(connection) && <span className={css.restriction}> {lanShareRestriction(connection)} </span>}
    </>
  )

  return (
    <>
      <ListItemLocation pathname={`${location.pathname}/${id}`}>
        <ListItemIcon>
          <ConnectionStateIcon connection={connection} service={service} size="lg" />
        </ListItemIcon>
        <ListItemText primary={<ServiceName service={service} connection={connection} />} secondary={details} />
        {connection && connection.active && <Throughput connection={connection} />}
        <ListItemSecondaryAction className={css.actions}>
          <BrowserButton connection={connection} service={service} />
          <SSHButton connection={connection} service={service} />
          <VNCButton connection={connection} service={service} />
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
  restriction: { color: colors.primary },
})
