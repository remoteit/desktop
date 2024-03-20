import React from 'react'
import { State } from '../store'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { SharedUsersLists } from '../components/SharedUsersLists'
import { selectSessionUsers } from '../selectors/sessions'
import { ListItemBack } from '../components/ListItemBack'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from '../components/Gutters'
import { MobileUI } from '../components/MobileUI'
import { Box } from '@mui/material'

export const ServiceUsersPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { serviceID = '' } = useParams<{ serviceID: string }>()
  const connected = useSelector((state: State) => selectSessionUsers(state, undefined, serviceID))
  const service = device?.services.find(s => s.id === serviceID)
  const users = service?.access

  return (
    <Gutters size="md" bottom={null}>
      <Box display="flex">
        <ListItemBack title="Service access" to="connect" />
        <MobileUI>
          <IconButton to="share" title="Add guest access" icon="share" fixedWidth />
        </MobileUI>
        <IconButton
          to="/organization/add"
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
