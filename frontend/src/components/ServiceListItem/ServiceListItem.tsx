import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { hostName } from '../../shared/nameHelper'
import { ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { lanShareRestriction, lanShared } from '../../helpers/lanSharing'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { ListItemLocation } from '../ListItemLocation'
import { SessionsButton } from '../../buttons/SessionsButton'
import { LaunchButton } from '../../buttons/LaunchButton'
import { ComboButton } from '../../buttons/ComboButton'
import { ErrorButton } from '../../buttons/ErrorButton'
import { ServiceName } from '../ServiceName'
import { CommandButton } from '../../buttons/CommandButton'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from '../Icon'
import { colors, spacing } from '../../styling'

export interface ServiceListItemProps {
  connection?: IConnection
  service?: IService
  indent?: boolean
  dense?: boolean
  secondary?: string | JSX.Element
}

export function ServiceListItem({ connection, service, indent, dense, secondary }: ServiceListItemProps) {
  const [showError, setShowError] = useState<boolean>(false)
  const user = useSelector((state: ApplicationState) => state.auth.user)
  const css = useStyles()
  const id = connection ? connection.id : service ? service.id : ''
  const otherUser = !!connection?.owner?.id && connection?.owner?.id !== user?.id

  secondary = secondary || (
    <span className={css.details}>
      {hostName(connection) && <span>{hostName(connection)}</span>}
      {lanShared(connection) && <span className={css.restriction}>{lanShareRestriction(connection)}</span>}
      {otherUser && (
        <span>
          <Icon name="user" size="bug" type="solid" inlineLeft />
          {connection?.owner?.email}
        </span>
      )}
    </span>
  )

  const className = indent ? css.indent : undefined

  return (
    <>
      <ListItemLocation className={className} pathname={`/devices/${service?.deviceID}/${id}`} dense={dense}>
        <ComboButton connection={connection} service={service} />
        <ListItemText primary={<ServiceName service={service} connection={connection} />} secondary={secondary} />
        <ListItemSecondaryAction>
          <LaunchButton connection={connection} service={service} />
          <CommandButton connection={connection} service={service} title="Copy Command" />
          <SessionsButton service={service} />
          <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
        </ListItemSecondaryAction>
      </ListItemLocation>
      <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
    </>
  )
}

const useStyles = makeStyles({
  indent: { paddingLeft: 57 },
  details: { '& > span': { marginRight: spacing.sm } },
  restriction: { color: colors.grayDarker },
  evaluation: { color: colors.warning },
})
