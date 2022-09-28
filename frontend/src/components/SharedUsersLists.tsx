import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Typography, Box } from '@mui/material'
import { ApplicationState } from '../store'
import { SharedUsersPaginatedList } from './SharedUsersPaginatedList'
import { selectMembersWithAccess, getOrganization } from '../models/organization'
import { AddUserButton } from '../buttons/AddUserButton'
import { IconButton } from '../buttons/IconButton'
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
  const { members, hasOrganization } = useSelector((state: ApplicationState) => ({
    members: selectMembersWithAccess(state, instance).map(m => m.user),
    hasOrganization: !!getOrganization(state).id,
  }))
  const disconnected = users.filter(user => !connected.find(_u => _u.email === user.email))
  const manager = !!instance?.permissions.includes('MANAGE')

  if (!connected.length && !disconnected.length && !members.length)
    return (
      <Gutters top="xxl" center>
        <Box paddingBottom={2} paddingTop={4}>
          <Icon name="user-group" type="light" fontSize={36} color="grayLight" />
        </Box>
        <Typography variant="caption" color="gray.main" component="div" gutterBottom>
          No one has access to this service.
        </Typography>
        <AddUserButton to={location.pathname.replace('users', 'share')} inlineLeft>
          <Typography variant="body2">Share to a guest</Typography>
        </AddUserButton>
        <Typography variant="caption" color="gray.main" component="div">
          or
        </Typography>
        {hasOrganization ? (
          <IconButton
            icon="user-plus"
            to="/organization/share"
            size="md"
            disabled={!instance?.permissions.includes('ADMIN')}
          >
            <Typography variant="body2"> &nbsp;&nbsp; Add an organization member</Typography>
          </IconButton>
        ) : (
          <IconButton icon="industry-alt" to="/organization" size="md">
            <Typography variant="body2"> &nbsp;&nbsp; Create your organization</Typography>
          </IconButton>
        )}
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
