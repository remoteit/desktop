import React from 'react'
import { getAccess } from '../../helpers/userHelper'
import { ListItemSecondaryAction, Tooltip } from '@mui/material'
import { ServiceIndicators } from '../ServiceIndicators'
import { spacing } from '../../styling'
import { Icon } from '../Icon'

type Props = {
  user: IUser
  device?: IDevice
}

export const ShareDetails: React.FC<Props> = ({ user, device }) => {
  if (!device) return null

  const { services, scripting } = getAccess(device, user.email)
  return (
    <ListItemSecondaryAction
      sx={{ display: 'flex', alignItems: 'center', '& svg': { marginRight: `${spacing.sm}px` } }}
    >
      {scripting && (
        <Tooltip title="Allow scripting" arrow placement="top">
          <span>
            <Icon name="scroll" size="sm" type="regular" color="grayDark" />
          </span>
        </Tooltip>
      )}
      <ServiceIndicators services={services} />
    </ListItemSecondaryAction>
  )
}
