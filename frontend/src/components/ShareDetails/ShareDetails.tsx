import React from 'react'
import { getPermissions } from '../../helpers/userHelper'
import { ListItemSecondaryAction, Tooltip, makeStyles } from '@material-ui/core'
import { ServiceMiniState } from '../ServiceMiniState'
import { spacing } from '../../styling'
import { Icon } from '../Icon'

type Props = {
  user: IUser
  device?: IDevice
}

export const ShareDetails: React.FC<Props> = ({ user, device }) => {
  const css = useStyles()

  if (!device) return null

  const { services, scripting } = getPermissions(device, user.email)
  return (
    <ListItemSecondaryAction className={css.indicators}>
      {scripting && (
        <Tooltip title="Allow scripting" arrow placement="top">
          <Icon name="scroll" size="sm" type="regular" color="grayDark" />
        </Tooltip>
      )}
      {!!services.length && services.map(s => <ServiceMiniState key={s.id} service={s} showConnected={false} />)}
    </ListItemSecondaryAction>
  )
}

const useStyles = makeStyles({
  indicators: {
    display: 'flex',
    alignItems: 'center',
    '& > .far': { marginRight: spacing.sm },
  },
})
