import React from 'react'
import { useLocation } from 'react-router-dom'
import { ListItemIcon, ListItemText } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { colors } from '../../styling'
import { Icon } from '../Icon'
import { getUsersConnectedDevice } from '../../models/devices'

type Props = {
  device: IDevice
  service?: IService
}

export const UsersSelect: React.FC<Props> = ({ device, service }) => {
  const location = useLocation()

  const connected = service ? service.sessions.length : getUsersConnectedDevice(device).length

  return (
    <ListItemLocation pathname={location.pathname + '/users'}>
      <ListItemIcon>
        <Icon name="user-friends" color={connected ? 'primary' : undefined} size="md" type="light" />
      </ListItemIcon>
      <ListItemText
        primary="Shared users"
        secondary={
          <>
            {device.access ? device.access.length  + ' total' : 'None'}
            &nbsp; &nbsp;
            {!!connected && <span style={{ color: colors.primary }}>{connected} connected</span>}
          </>
        }
      />
    </ListItemLocation>
  )
}
