import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { SharedUsersLists } from '../components/SharedUsersLists'
import { ApplicationState } from '../store'
import { selectSessionUsers } from '../models/sessions'
import { ListItemBack } from '../components/ListItemBack'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from '../components/Gutters'
import { Box } from '@mui/material'

export const ServiceUsersPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { serviceID = '' } = useParams<{ serviceID: string }>()
  const { service, connected } = useSelector((state: ApplicationState) => ({
    connected: selectSessionUsers(state, serviceID),
    service: device?.services.find(s => s.id === serviceID),
  }))
  const users = service?.access

  return (
    <Gutters size="md" bottom={null}>
      <Box display="flex">
        <ListItemBack title="Service access" />
        <IconButton to="share" title="Add guest access" icon="plus" fixedWidth />
        <IconButton
          to="/organization/share"
          icon="user-plus"
          size="md"
          title="Add organization member"
          disabled={!device?.permissions.includes('ADMIN')}
        />
      </Box>
      <SharedUsersLists users={users} connected={connected} device={device} />
    </Gutters>
  )
}
