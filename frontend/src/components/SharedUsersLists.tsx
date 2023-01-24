import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Typography, Box, Paper, Tooltip } from '@mui/material'
import { ApplicationState } from '../store'
import { SharedUsersPaginatedList } from './SharedUsersPaginatedList'
import { selectMembersWithAccess } from '../models/organization'
import { selectOrganization } from '../selectors/organizations'
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
    hasOrganization: !!selectOrganization(state).id,
  }))
  const disconnected = users.filter(user => !connected.find(_u => _u.email === user.email))
  const manager = !!instance?.permissions.includes('MANAGE')

  if (!connected.length && !disconnected.length && !members.length)
    return (
      <Paper elevation={0} sx={{ contain: 'layout', marginTop: 2 }}>
        <Gutters center bottom="xxl" top="lg">
          <Box paddingBottom={4} paddingTop={4}>
            <Tooltip title="No one has access to this service." placement="top" arrow>
              <Icon name="user-slash" type="light" fontSize={28} color="gray" />
            </Tooltip>
          </Box>
          <AddUserButton to={location.pathname.replace('users', 'share')} iconInlineLeft>
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
      </Paper>
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
