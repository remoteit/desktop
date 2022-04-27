import React, { useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { List, Typography, ListSubheader } from '@material-ui/core'
import { selectPermissions, getOrganization } from '../models/organization'
import { selectRemoteitLicense } from '../models/plans'
import { selectLimitsLookup } from '../models/organization'
import { PaywallUI } from '../components/PaywallUI'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationPage: React.FC = () => {
  const { initialized, permissions, limits, organization, license } = useSelector((state: ApplicationState) => ({
    organization: getOrganization(state),
    initialized: state.organization.initialized,
    permissions: selectPermissions(state),
    limits: selectLimitsLookup(state),
    license: selectRemoteitLicense(state),
  }))

  useEffect(() => {
    analyticsHelper.page('OrganizationPage')
  }, [])

  if (initialized && !organization.id) return <Redirect to={'/organization/empty'} />

  const admin = !!permissions?.includes('ADMIN')

  return (
    <Container
      gutterBottom
      header={
        <Gutters top="sm">
          {license && <ListSubheader disableGutters>{license?.plan.description} Plan</ListSubheader>}
          <Typography variant="h2" gutterBottom>
            <Title>{organization.name || '...'}</Title>
          </Typography>
        </Gutters>
      }
    >
      {!admin && (
        <Notice severity="info" gutterTop>
          You need admin privileges to change this organization.
        </Notice>
      )}
      <List>
        <ListItemLocation
          title="Members"
          pathname="/organization/members"
          icon="users"
          match={['/organization', '/organization/members']}
          disabled={!admin}
          exactMatch
          showDisabled
          dense
        />
        <PaywallUI limitName="roles" title="Roles are available for Business and Enterprise plans">
          <ListItemLocation
            title="Roles"
            icon="user"
            pathname={`/organization/roles/${organization?.roles.find(r => !r.disabled)?.id}`}
            disabled={!limits.roles || !admin}
            showDisabled
            dense
          />
        </PaywallUI>
        <ListItemLocation
          title="Tags"
          pathname="/organization/tags"
          icon="tag"
          disabled={!limits.tagging || !admin}
          showDisabled
          dense
        />
        <ListItemLocation
          title="Settings"
          icon="sliders-h"
          pathname="/organization/saml"
          disabled={!admin}
          showDisabled
          dense
        />
      </List>
    </Container>
  )
}
