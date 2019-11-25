import React from 'react'
import { IService } from 'remote.it'
import { makeStyles } from '@material-ui/styles'
import { useHistory, useLocation } from 'react-router-dom'
import { ListItem, ListItemIcon, Typography, List } from '@material-ui/core'
import { lanShareRestriction } from '../../helpers/lanSharing'
import { spacing, colors } from '../../styling'
import { NextButton } from '../NextButton'
import { IP_OPEN } from '../../constants'
import { Icon } from '../Icon'

export type Props = {
  service: IService
  connection?: IConnection
}

export const LanShareSelect: React.FC<Props> = ({ connection, service }) => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const lanShare: boolean = !!(connection && connection.host === IP_OPEN)
  const disabled: boolean = (connection && connection.active) || service.state !== 'active'
  const onClick = () => history.push(location.pathname + '/lan')

  return (
    <List>
      <ListItem button onClick={onClick} disabled={disabled}>
        <ListItemIcon>
          <Icon name="network-wired" color={lanShare ? 'primary' : 'gray'} size="lg" />
        </ListItemIcon>
        <span className={css.text}>
          <Typography variant="caption">Local Network Sharing</Typography>
          <Typography variant="h2">{lanShareRestriction(connection)}</Typography>
        </span>
        <NextButton />
      </ListItem>
    </List>
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
