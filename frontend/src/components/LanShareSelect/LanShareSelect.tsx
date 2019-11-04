import React from 'react'
import { Icon } from '../Icon'
import { makeStyles } from '@material-ui/styles'
import { ButtonBase } from '@material-ui/core'
import { lanShareRestriction } from '../../helpers/lanSharing'
import { spacing, colors } from '../../styling'

export type Props = {
  onClick?: () => any
}

export const LanShareSelect: React.FC<Props> = ({ onClick }) => {
  const css = useStyles()
  // @TODO bring in state from cloud through backend?
  // const state: ipAddress = useSelector((state: ApplicationState) => state.preferences.serviceLanSharing[service.id])
  const state = '0.0.0.0'

  return (
    <ButtonBase onClick={onClick} className={css.handlerItem}>
      <Icon name="network-wired" color={state ? 'primary' : 'gray-dark'} size="lg" />
      <div className={css.handlerText}>
        <span>Local Network Sharing</span>
        <span>{lanShareRestriction(state)}</span>
      </div>
      <Icon name="chevron-right" size="md" fixedWidth />
    </ButtonBase>
  )
}

export default LanShareSelect

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
