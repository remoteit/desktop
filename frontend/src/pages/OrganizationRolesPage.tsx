import React from 'react'
import { Redirect, useHistory } from 'react-router-dom'
import { List, ListItemSecondaryAction, Typography, Chip, Box, Button } from '@mui/material'
import { selectLimitsLookup, selectOrganization } from '../selectors/organizations'
import { selectPermissions } from '../models/organization'
import { ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { useSelector } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const OrganizationRolesPage: React.FC = () => {
  const history = useHistory()
  const { name, roles, members, limits, permissions } = useSelector((state: ApplicationState) => ({
    ...selectOrganization(state),
    limits: selectLimitsLookup(state),
    permissions: selectPermissions(state),
  }))

  if (!permissions?.includes('ADMIN')) return <Redirect to={'/organization'} />

  return (
    <Container
      gutterBottom
      header={
        <Gutters top="sm" size="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h2">
              <Title>Roles</Title>
            </Typography>
            <Chip
              label={name}
              size="small"
              icon={<Icon name="chevron-left" size="xxs" type="solid" color="grayDark" fixedWidth />}
              onClick={() => history.push('/organization')}
            />
          </Box>
        </Gutters>
      }
    >
      {!limits.roles && (
        <Notice severity="info" gutterTop>
          Upgrade your plan to Business to add custom roles.
          <Button
            variant="contained"
            size="small"
            onClick={() => history.push('/account/plans')}
            sx={{ display: 'block', marginTop: 1, marginBottom: 1 }}
          >
            Upgrade
          </Button>
        </Notice>
      )}
      <Typography variant="subtitle1">
        <Title>Role</Title>
        {limits.roles && <IconButton icon="plus" to={'/organization/roles/add'} title="Add role" size="lg" />}
      </Typography>
      <List>
        {roles.map(r => {
          if (r.disabled) return null
          const count = members.filter(m => m.roleId === r.id).length
          return (
            <ListItemLocation
              key={r.id}
              title={
                <Box sx={{ color: r.system ? 'primary.main' : undefined, display: 'flex', alignItems: 'center' }}>
                  {r.system && <Icon name="lock" size="xxxs" type="solid" inlineLeft />}
                  {r.name}
                </Box>
              }
              pathname={`/organization/roles/${r.id}`}
              exactMatch
              disableIcon
              dense
            >
              <ListItemSecondaryAction>
                <Chip
                  label={count ? `${count} member${count === 1 ? '' : 's'}` : 'none'}
                  size="small"
                  onClick={() => history.push('/organization/members')}
                />
              </ListItemSecondaryAction>
            </ListItemLocation>
          )
        })}
      </List>
    </Container>
  )
}
