import React from 'react'
import { List, Typography } from '@material-ui/core'
import { UserListItem } from '../UserListItem'
import { ShareDetails } from '../ShareDetails'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'

interface Props {
  device?: IDevice
  connected?: IUser[]
  users?: IUser[]
  sharedUsers?: IUser[]
}

const sort = (users: IUser[]) => users.sort((a, b) => (a.email > b.email ? 1 : b.email > a.email ? -1 : 0))

export const SharedUsersList: React.FC<Props> = ({ device, connected = [], users = [] }) => {
  const { access, isAccountOwner } = useSelector((state: ApplicationState) => ({
    access: state.organization.members.map(m => m.user),
    isAccountOwner: state.auth.user?.id === device?.accountId,
  }))
  const filtered = sort(users.filter(user => !connected.find(_u => _u.email === user.email)))
  const listUserLinked = sort(access.filter(user => !connected.find(_u => _u.email === user.email)))
  const listUserShared = sort(users.filter(user => !connected.find(_u => _u.email === user.email)))

  if (!users?.length && !access.length) return null

  return (
    <>
      {!!connected.length && (
        <>
          <Typography variant="subtitle1" color="primary">
            Connected
          </Typography>
          <List>
            {connected.map(user => (
              <UserListItem key={user.email} user={user} isConnected={true}>
                <ShareDetails user={user} device={device} connected />
              </UserListItem>
            ))}
          </List>
        </>
      )}
      {!!listUserShared.length && !!filtered.length && (
        <>
          <Typography variant="subtitle1">Shared</Typography>
          <List>
            {filtered.map(user => (
              <UserListItem key={user.email} user={user}>
                <ShareDetails user={user} device={device} />
              </UserListItem>
            ))}
          </List>
        </>
      )}
      {!!listUserLinked.length && isAccountOwner && (
        <>
          <Typography variant="subtitle1">Organization members</Typography>
          <List>
            {listUserLinked.map(user => (
              <UserListItem key={user.email} user={user} isUserLinked={true}>
                <ShareDetails user={user} device={device} />
              </UserListItem>
            ))}
          </List>
        </>
      )}
    </>
  )
}
