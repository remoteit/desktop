import React from 'react'
import { useLocation } from 'react-router-dom'
import { ListItemIcon, ListItemText } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { colors } from '../../styling'
import { Icon } from '../Icon'
import { getUsersConnectedDeviceOrService } from '../../models/devices'

type Props = {
  device?: IDevice
  service?: IService
}

export const UsersSelect: React.FC<Props> = ({ device, service }) => {
  const location = useLocation()
  const connected = getUsersConnectedDeviceOrService(device, service).length
  const total = service ? service.access.length : device?.access.length

  if (device?.shared) return null

  return (
    <ListItemLocation pathname={location.pathname + '/users'}>
      <ListItemIcon>
        <Icon name="user-friends" color={connected ? 'primary' : undefined} size="md" type="light" />
      </ListItemIcon>
      <ListItemText
        primary="Shared Users"
        secondary={
          <>
            {total ? total + ' total' : 'None'}
            &nbsp; &nbsp;
            {!!connected && <span style={{ color: colors.primary }}>{connected} connected</span>}
          </>
        }
      />
    </ListItemLocation>
  )
}
