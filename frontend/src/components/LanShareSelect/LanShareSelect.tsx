import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Icon } from '../Icon'
import { NextButton } from '../NextButton'
import { makeStyles } from '@material-ui/styles'
import { ListItem, ListItemIcon, Typography } from '@material-ui/core'
import { lanShareRestriction } from '../../helpers/lanSharing'
import { spacing, colors } from '../../styling'
import { IP_OPEN } from '../../constants'

export type Props = {
  onClick?: () => any
  serviceID?: string
}

export const LanShareSelect: React.FC<Props> = ({ onClick, serviceID }) => {
  const css = useStyles()
  const connection = useSelector((state: ApplicationState) => state.backend.connections.find(c => c.id === serviceID))
  const lanShare: boolean = !!(connection && connection.host === IP_OPEN)

  return (
    <ListItem button onClick={onClick}>
      <ListItemIcon>
        <Icon name="network-wired" color={lanShare ? 'primary' : 'gray-dark'} size="lg" />
      </ListItemIcon>
      <span className={css.text}>
        <Typography variant="caption">Local Network Sharing</Typography>
        <Typography variant="subtitle2">{lanShareRestriction(connection)}</Typography>
      </span>
      <NextButton />
    </ListItem>
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
