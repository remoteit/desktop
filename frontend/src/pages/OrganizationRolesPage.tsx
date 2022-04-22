import React, { useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { List, ListItemSecondaryAction, Typography, Chip } from '@material-ui/core'
import { getActiveOrganizationMembership, getActiveOrganizationPermissions } from '../models/accounts'
import { ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { useSelector } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationRolesPage: React.FC = () => {
  const { roles, members, permissions } = useSelector((state: ApplicationState) => ({
    ...getActiveOrganizationMembership(state).organization,
    permissions: getActiveOrganizationPermissions(state),
  }))

  useEffect(() => {
    analyticsHelper.page('OrganizationRolesPage')
  }, [])

  if (!permissions?.includes('ADMIN')) return <Redirect to={'/organization'} />

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Roles</Title>
        </Typography>
      }
    >
      <Typography variant="subtitle1">
        <Title>Role</Title>
        <IconButton icon="plus" to={'/organization/roles/add'} title="Add role" />
      </Typography>
      <List>
        {roles.map(r => {
          if (r.disabled) return null
          const count = members.filter(m => m.roleId === r.id).length
          return (
            <ListItemLocation
              key={r.id}
              title={r.name}
              pathname={`/organization/roles/${r.id}`}
              exactMatch
              disableIcon
              dense
            >
              <ListItemSecondaryAction>
                <Chip label={count ? `${count} member${count === 1 ? '' : 's'}` : 'none'} size="small" />
              </ListItemSecondaryAction>
            </ListItemLocation>
          )
        })}
      </List>
    </Container>
  )
}
