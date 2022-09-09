import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { selectSessionUsers } from '../../models/sessions'
import { getOrganization } from '../../models/organization'
import { makeStyles } from '@mui/styles'
import { ListItemIcon, ListItemText } from '@mui/material'
import { ListItemLocation } from '../ListItemLocation'
import { Icon } from '../Icon'

type Props = {
  device?: IDevice
  service?: IService
}

export const UsersSelect: React.FC<Props> = ({ device, service }) => {
  const css = useStyles()
  const { connected, access } = useSelector((state: ApplicationState) => ({
    connected: selectSessionUsers(state, service ? service.id : device?.id).length,
    access: device?.owner.id === state.auth.user?.id ? getOrganization(state).members.map(m => m.user) : [],
  }))
  const users = (service ? service.access : device?.access) || []
  const usersLinked = access.filter(user => !users.find(_u => _u.email === user.email))
  const total = users.length + usersLinked.length

  if (!device?.permissions.includes('MANAGE')) return null

  let pathname = `/devices/${device?.id}`
  if (service) pathname += `/${service.id}`
  pathname += total ? '/users' : '/share'

  return (
    <ListItemLocation pathname={pathname} dense>
      <ListItemIcon>
        <Icon name="user-group" color="grayDarker" size="md" />
      </ListItemIcon>
      <ListItemText
        primary={total ? 'Users' : 'Share'}
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
