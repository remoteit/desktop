import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Typography, Box } from '@mui/material'
import { ApplicationState } from '../store'
import { SharedUsersPaginatedList } from './SharedUsersPaginatedList'
import { selectMembersWithAccess } from '../models/organization'
import { AddUserButton } from '../buttons/AddUserButton'
import { Gutters } from './Gutters'
import { Icon } from './Icon'

interface Props {
  device?: IDevice
  network?: INetwork
  users?: IUser[]
  connected?: IUser[]
}

export const SharedUsersLists: React.FC<Props> = ({ device, network, connected = [], users = [] }) => {
  const instance = device || network
  const location = useLocation()
  const members = useSelector((state: ApplicationState) => selectMembersWithAccess(state, instance).map(m => m.user))
  const disconnected = users.filter(user => !connected.find(_u => _u.email === user.email))
  const manager = !!instance?.permissions.includes('MANAGE')

  if (!connected.length && !disconnected.length && !members.length)
    return (
      <Gutters top="xxl" center>
        <Box paddingBottom={3} paddingTop={4}>
          <Icon name="user-group" type="light" fontSize={40} color="grayLight" />
        </Box>
        <Typography variant="body2" color="gray.main">
          No users have access
        </Typography>
        <Typography variant="body1">
          <AddUserButton to={location.pathname.replace('users', 'share')} inlineLeft>
            <Typography>Add a user</Typography>
          </AddUserButton>
        </Typography>
      </Gutters>
    )

  return (
    <>
      <SharedUsersPaginatedList title="Connected" device={device} users={connected} connected />
      <SharedUsersPaginatedList title="Guests" device={device} remove={network?.id} users={sort(disconnected)} />
      {manager && (
        <SharedUsersPaginatedList title="Organization members" device={device} users={sort(members)} members />
      )}
    </>
  )
}

const sort = (users: IUser[]) => users.sort((a, b) => (a.email > b.email ? 1 : b.email > a.email ? -1 : 0))
