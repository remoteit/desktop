import React from 'react'
import { List, Divider, Typography, makeStyles } from '@material-ui/core'
import { UserListItem } from '../UserListItem'
import { ShareDetails } from '../ShareDetails'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { spacing } from '../../styling'

interface Props {
  device?: IDevice
  connected?: IUser[]
  users?: IUser[]
  sharedUsers?: IUser[]
}

const sort = (users: IUser[]) => users.sort((a, b) => (a.email > b.email ? 1 : b.email > a.email ? -1 : 0))

export const SharedUsersList: React.FC<Props> = ({ device, connected = [], users = [] }) => {
  const { access } = useSelector((state: ApplicationState) => state.accounts)
  const filtered = sort(
    users.filter(
      user => !connected.find(_u => _u.email === user.email) && !access.find(shared => shared.email === user.email)
    )
  )
  const listUserLinked = sort(users.filter(user => access.find(_u => _u.email === user.email)))
  const css = useStyles()

  if (!users?.length) return null

  return (
    <>
      <List>
        {!!connected.length && (
          <Typography variant="subtitle1" color="primary">
            Connected
          </Typography>
        )}
        {connected.map(user => (
          <UserListItem key={user.email} user={user} isConnected={true}>
            <ShareDetails user={user} device={device} connected />
          </UserListItem>
        ))}
        {!!connected.length && <Divider />}
        {!!listUserLinked.length && <Typography variant="subtitle1">Device List Shared</Typography>}
        {listUserLinked.map(user => (
          <UserListItem key={user.email} user={user} isUserLinked={true}>
            <ShareDetails user={user} device={device} />
          </UserListItem>
        ))}
        {!!listUserLinked.length && <Divider className={css.divider} />}
        {filtered.map(user => (
          <UserListItem key={user.email} user={user}>
            <ShareDetails user={user} device={device} />
          </UserListItem>
        ))}
      </List>
    </>
  )
}

const useStyles = makeStyles({
  divider: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
})
