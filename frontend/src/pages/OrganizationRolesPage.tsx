import React from 'react'
import { Redirect, useHistory } from 'react-router-dom'
import { List, ListItemSecondaryAction, Typography, Chip, Box, Button } from '@mui/material'
import { selectPermissions, selectLimitsLookup, selectOrganization } from '../selectors/organizations'
import { State } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { useSelector } from 'react-redux'
import { ListItemBack } from '../components/ListItemBack'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { BillingUI } from '../components/BillingUI'
import { MobileUI } from '../components/MobileUI'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const OrganizationRolesPage: React.FC = () => {
  const history = useHistory()
  const { name, roles, members, limits, permissions } = useSelector((state: State) => ({
    ...selectOrganization(state),
    limits: selectLimitsLookup(state),
    permissions: selectPermissions(state),
  }))

  if (!permissions.includes('ADMIN'))
    return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Roles</Title>
          </Typography>
          <MobileUI hide>
            <List sx={{ paddingTop: 0 }}>
              <ListItemBack title={name} to="/organization" disableGutters={false} />
            </List>
          </MobileUI>
        </>
      }
    >
      {!limits.roles && (
        <Notice severity="info" gutterTop>
          Upgrade your plan to Business to add custom roles.
          <BillingUI>
            <Button
              variant="contained"
              size="small"
              onClick={() => history.push('/account/plans')}
              sx={{ display: 'block', marginTop: 1, marginBottom: 1 }}
            >
              Upgrade
            </Button>
          </BillingUI>
        </Notice>
      )}
      <Typography variant="subtitle1">
        <Title>Role</Title>
        {limits.roles && <IconButton icon="plus" to="/organization/roles/add" title="Add role" size="md" />}
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
              to={`/organization/roles/${r.id}`}
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
