import React from 'react'
import { List, Divider, Typography } from '@material-ui/core'
import { getUsersConnectedDeviceOrService, getDetailUserPermission } from '../../models/devices'
import { UserListItem } from '../UserListItem'

interface Props {
  device?: IDevice
  service?: IService
}

export const SharedUsersList: React.FC<Props> = ({ device, service }) => {
  const sortUsers = (users: any) => users.sort((a: any, b: any) => (a.email > b.email ? 1 : b.email > a.email ? -1 : 0))

  const usersConnected = getUsersConnectedDeviceOrService(device, service)
  const users = service ? service.access : device?.access || []
  const userToRenderConnected = sortUsers(usersConnected)
  const userToRenderNotConnected = sortUsers(users.filter(user => !usersConnected.find(_u => _u.email === user.email)))

  if (!device?.access?.length) return null

  const renderRowUser = (user: IUser, index: string, isConnected: boolean) => {
    const permission = service ? null : getDetailUserPermission(device, user.email)
    return (
      <UserListItem
        permission={permission}
        user={user}
        index={index}
        isConnected={isConnected}
        showDetails={!service}
      />
    )
  }

  return (
    <>
      {!!usersConnected.length && (
        <Typography variant="subtitle1" color="primary">
          Connected
        </Typography>
      )}
      <List>
        {userToRenderConnected.sort().map((user: any, index: any) => renderRowUser(user, index, true))}
        {!!usersConnected.length && <Divider />}
        {userToRenderNotConnected.sort().map((user: any, index: any) => renderRowUser(user, index, false))}
      </List>
    </>
  )
}
