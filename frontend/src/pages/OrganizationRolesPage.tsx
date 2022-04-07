import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { List, Typography, Chip } from '@material-ui/core'
import { ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { useSelector } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationRolesPage: React.FC = () => {
  const history = useHistory()
  const { name, roles } = useSelector((state: ApplicationState) => state.organization)

  useEffect(() => {
    analyticsHelper.page('OrganizationRolesPage')
  }, [])

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Roles</Title>
          <Chip label={name} size="small" onClick={() => history.push('/account/organization')} />
        </Typography>
      }
    >
      <Typography variant="subtitle1">
        <Title>Role</Title>
        <IconButton icon="plus" to={'/account/organization/roles/add'} title="Add role" />
      </Typography>

      <List>
        {roles.map(r => (
          <ListItemLocation
            key={r.id}
            title={r.name}
            pathname={`/account/organization/roles/${r.id}`}
            exactMatch
            disableIcon
            dense
          />
        ))}
      </List>
    </Container>
  )
}
