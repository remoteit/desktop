import React from 'react'
import { useLocation } from 'react-router-dom'
import { getConnected } from '../../helpers/userHelper'
import { ListItemIcon, ListItemText } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { colors } from '../../styling'
import { Icon } from '../Icon'

type Props = {
  device?: IDevice
  service?: IService
  access: IUser[]
}

export const UsersSelect: React.FC<Props> = ({ device, service, access }) => {
  const location = useLocation()
  const connected = service ? getConnected([service]).length : getConnected(device?.services).length
  const users = (service ? service.access : device?.access) || []
  const usersLinked = access.filter(user => !users.find(_u => _u.email === user.email))
  const total = users.length + usersLinked.length

  if (device?.shared) return null

  return (
    <ListItemLocation pathname={`${location.pathname}/${total ? 'users' : 'share'}`} dense>
      <ListItemIcon>
        <Icon name="user-friends" color={connected ? 'primary' : undefined} size="md" type="light" />
      </ListItemIcon>
      <ListItemText
        primary={total ? 'Shared Users' : 'Add Shared User'}
        secondary={
          !!total && (
            <>
              {total ? total + ' total' : ''}
              &nbsp; &nbsp;
              {!!connected && <span style={{ color: colors.primary }}>{connected} connected</span>}
            </>
          )
        }
      />
    </ListItemLocation>
  )
}
