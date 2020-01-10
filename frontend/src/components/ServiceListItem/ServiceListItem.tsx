import React, { useState } from 'react'
import { IService } from 'remote.it'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { hostName } from '../../helpers/nameHelper'
import { useLocation } from 'react-router-dom'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { lanShareRestriction, lanShared } from '../../helpers/lanSharing'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { ListItemLocation } from '../ListItemLocation'
import { DisconnectButton } from '../../buttons/DisconnectButton'
import { ConnectButton } from '../../buttons/ConnectButton'
import { LaunchButton } from '../../buttons/LaunchButton'
import { ErrorButton } from '../../buttons/ErrorButton'
import { ServiceName } from '../ServiceName'
import { CopyButton } from '../../buttons/CopyButton'
import { Throughput } from '../Throughput'
import { makeStyles } from '@material-ui/styles'
import { colors, spacing } from '../../styling'

export interface ServiceListItemProps {
  connection?: IConnection
  service?: IService
  indent?: boolean
}

export function ServiceListItem({ connection, service, indent }: ServiceListItemProps) {
  const location = useLocation()
  const user = useSelector((state: ApplicationState) => state.auth.user)
  const css = useStyles()
  const [showError, setShowError] = useState<boolean>(false)
  const id = connection ? connection.id : service ? service.id : ''
  const owner = connection && connection.owner
  const notOwner: boolean = !!(user && owner && user.username !== owner)

  const details = (
    <span className={css.details}>
      {connection && hostName(connection)}
      {lanShared(connection) && <span className={css.restriction}> {lanShareRestriction(connection)} </span>}
      {notOwner && <span>Owned by {owner}</span>}
    </span>
  )

  const className = indent ? css.indent : undefined

  return (
    <>
      <ListItemLocation className={className} pathname={`${location.pathname}/${id}`} disabled={notOwner}>
        <div className={css.buttons}>
          <ConnectButton connection={connection} service={service} size="small" color="success" />
          <DisconnectButton connection={connection} size="small" color="primary" />
        </div>
        <ListItemIcon>
          <ConnectionStateIcon connection={connection} service={service} size="lg" />
        </ListItemIcon>
        <ListItemText primary={<ServiceName service={service} connection={connection} />} secondary={details} />
        {connection && connection.active && <Throughput connection={connection} />}
        <ListItemSecondaryAction className={css.actions + ' hidden'}>
          <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
          <LaunchButton connection={connection} service={service} />
          <CopyButton connection={connection} service={service} />
        </ListItemSecondaryAction>
      </ListItemLocation>
      {showError && <ConnectionErrorMessage connection={connection} service={service} />}
    </>
  )
}

const useStyles = makeStyles({
  indent: { paddingLeft: spacing.xxl },
  actions: { right: 70, display: 'none' },
  buttons: {
    width: 121,
    marginLeft: spacing.md,
    position: 'relative',
    '& > div:first-child': { position: 'absolute', width: '100%' },
  },
  details: { '& > span': { marginLeft: spacing.xs } },
  restriction: { color: colors.grayDarker },
})
