import React from 'react'
import { List, Divider, Typography } from '@material-ui/core'
import { UserListItem } from '../UserListItem'
import { ShareDetails } from '../ShareDetails'

interface Props {
  device?: IDevice
  connected?: IUser[]
  users?: IUser[]
}

const sort = (users: IUser[]) => users.sort((a, b) => (a.email > b.email ? 1 : b.email > a.email ? -1 : 0))

export const SharedUsersList: React.FC<Props> = ({ device, connected = [], users = [] }) => {
  const filtered = sort(users.filter(user => !connected.find(_u => _u.email === user.email)))

  if (!users?.length) return null

  return (
    <>
      {!!connected.length && (
        <Typography variant="subtitle1" color="primary">
          Connected
        </Typography>
      )}
      <List>
        {connected.map((user, index) => (
          <UserListItem user={user} index={index} isConnected={true}>
            <ShareDetails user={user} device={device} />
          </UserListItem>
        ))}
        {!!connected.length && <Divider />}
        {filtered.map((user, index) => (
          <UserListItem user={user} index={index} isConnected={false}>
            <ShareDetails user={user} device={device} />
          </UserListItem>
        ))}
      </List>
    </>
  )
}
