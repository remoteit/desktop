import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { List, Typography } from '@material-ui/core'
import { ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationRolesPage: React.FC = () => {
  const history = useHistory()
  const { roleID } = useParams<{ roleID?: string }>()
  const { roles } = useSelector((state: ApplicationState) => ({
    roles: state.organization.roles,
  }))

  useEffect(() => {
    if (!roleID) history.replace(`/account/organization/roles/${roles[0].id}`)
    analyticsHelper.page('OrganizationRolesPage')
  }, [])

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Organization Roles</Title>
        </Typography>
      }
    >
      <List>
        {roles.map(r => (
          <ListItemLocation
            key={r.id}
            title={r.name}
            pathname={`/account/organization/roles/${r.id}`}
            exactMatch
            dense
          />
        ))}
      </List>
    </Container>
  )
}
