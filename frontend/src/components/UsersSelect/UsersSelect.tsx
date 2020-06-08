import React from 'react'
import { useLocation } from 'react-router-dom'
import { ListItemIcon, ListItemText } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { colors } from '../../styling'
import { Icon } from '../Icon'

type Props = {
  service: IService
}

export const UsersSelect: React.FC<Props> = ({ service }) => {
  const location = useLocation()
  const connected = service.sessions.length

  return (
    <ListItemLocation disabled={!service.access.length} pathname={location.pathname + '/users'}>
      <ListItemIcon>
        <Icon name="user-friends" color={connected ? 'primary' : undefined} size="md" weight="light" />
      </ListItemIcon>
      <ListItemText
        primary="Users"
        secondary={
          <>
            {service.access.length ? service.access.length + ' total' : 'None'}
            &nbsp; &nbsp;
            {!!connected && <span style={{ color: colors.primary }}>{connected} connected</span>}
          </>
        }
      />
    </ListItemLocation>
  )
}
