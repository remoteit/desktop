import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { hostName } from '../../shared/nameHelper'
import { useLocation } from 'react-router-dom'
import { ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { lanShareRestriction, lanShared } from '../../helpers/lanSharing'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { ListItemLocation } from '../ListItemLocation'
import { SessionsButton } from '../../buttons/SessionsButton'
import { LaunchButton } from '../../buttons/LaunchButton'
import { ComboButton } from '../../buttons/ComboButton'
import { ErrorButton } from '../../buttons/ErrorButton'
import { ServiceName } from '../ServiceName'
import { CopyButton } from '../../buttons/CopyButton'
import { makeStyles } from '@material-ui/core/styles'
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
        <ComboButton connection={connection} service={service} />
        <ListItemText primary={<ServiceName service={service} connection={connection} />} secondary={details} />
        <ListItemSecondaryAction>
          <LaunchButton connection={connection} service={service} />
          <CopyButton connection={connection} service={service} />
          <SessionsButton service={service} />
          <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
        </ListItemSecondaryAction>
      </ListItemLocation>
      <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
    </>
  )
}

const useStyles = makeStyles({
  indent: { paddingLeft: spacing.xxl },
  details: { '& > span': { marginLeft: spacing.xs } },
  restriction: { color: colors.grayDarker },
})
