import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { selectSessionUsers } from '../../models/sessions'
import { makeStyles, ListItemIcon, ListItemText } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { Icon } from '../Icon'

type Props = {
  device?: IDevice
  service?: IService
  access: IUser[]
}

export const UsersSelect: React.FC<Props> = ({ device, service, access }) => {
  const css = useStyles()
  const connected = useSelector(
    (state: ApplicationState) => selectSessionUsers(state, service ? service.id : device?.id).length
  )
  const users = (service ? service.access : device?.access) || []
  const usersLinked = access.filter(user => !users.find(_u => _u.email === user.email))
  const total = users.length + usersLinked.length

  if (device?.shared) return null

  let pathname = `/devices/${device?.id}`
  if (service) pathname += `/${service.id}`
  pathname += total ? '/users' : '/share'

  return (
    <ListItemLocation pathname={pathname} dense>
      <ListItemIcon>
        <Icon name="user-friends" color={connected ? 'primary' : 'grayDarker'} size="md" />
      </ListItemIcon>
      <ListItemText
        primary={total ? 'Users' : 'Add User'}
        secondary={
          !!total && (
            <>
              {total ? total + ' total' : ''}
              <br />
              {!!connected && <span className={css.text}>{connected} connected</span>}
            </>
          )
        }
      />
    </ListItemLocation>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  text: { color: palette.primary.main },
}))
