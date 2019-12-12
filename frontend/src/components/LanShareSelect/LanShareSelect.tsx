import React from 'react'
import { IService } from 'remote.it'
import { makeStyles } from '@material-ui/styles'
import { useLocation } from 'react-router-dom'
import { ListItemIcon, Typography } from '@material-ui/core'
import { lanShareRestriction, lanShared } from '../../helpers/lanSharing'
import { ListItemLocation } from '../ListItemLocation'
import { spacing, colors } from '../../styling'
import { IP_OPEN } from '../../constants'
import { Icon } from '../Icon'

export type Props = {
  service: IService
  connection?: IConnection
}

export const LanShareSelect: React.FC<Props> = ({ connection, service }) => {
  const css = useStyles()
  const location = useLocation()
  const shared = lanShared(connection)
  const disabled: boolean = (connection && connection.active) || service.state !== 'active'

  return (
    <ListItemLocation disabled={disabled} pathname={location.pathname + '/lan'}>
      <ListItemIcon>
        <Icon name="network-wired" color={shared ? 'primary' : 'gray'} size="lg" />
      </ListItemIcon>
      <span className={css.text}>
        <Typography variant="caption">Local Network Sharing</Typography>
        <Typography variant="h2">
          {shared && 'On -'} {lanShareRestriction(connection)}
        </Typography>
      </span>
    </ListItemLocation>
  )
}

const useStyles = makeStyles({
  icon: { marginRight: spacing.lg, marginLeft: spacing.sm },
  handlerItem: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLightest,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  handlerIcon: {
    width: 30,
    height: 30,
    marginRight: spacing.lg,
  },
  text: {
    flexGrow: 1,
  },
})
