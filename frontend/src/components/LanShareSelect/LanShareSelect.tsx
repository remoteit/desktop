import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Icon } from '../Icon'
import { makeStyles } from '@material-ui/styles'
import { ButtonBase } from '@material-ui/core'
import { lanShareRestriction } from '../../helpers/lanSharing'
import { spacing, colors } from '../../styling'
import { IP_OPEN } from '../../constants'

export type Props = {
  onClick?: () => any
  serviceID?: string
}

export const LanShareSelect: React.FC<Props> = ({ onClick, serviceID }) => {
  const css = useStyles()
  const connection = useSelector((state: ApplicationState) => state.jump.connections.find(c => c.id === serviceID))
  const lanShare: boolean = !!(connection && connection.host === IP_OPEN)
  const restriction: ipAddress = (lanShare && connection && connection.restriction) || IP_OPEN

  return (
    <ButtonBase onClick={onClick} className={css.handlerItem}>
      <Icon name="network-wired" color={lanShare ? 'primary' : 'gray-dark'} size="lg" />
      <div className={css.handlerText}>
        <span>Local Network Sharing</span>
        <span>{lanShareRestriction(restriction)}</span>
      </div>
      <Icon name="chevron-right" size="md" fixedWidth />
    </ButtonBase>
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
  handlerText: {
    width: '80%',
  },
})
