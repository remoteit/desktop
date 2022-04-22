import React, { useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { List, Typography } from '@material-ui/core'
import { ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { getActiveOrganizationPermissions, getActiveOrganizationMembership } from '../models/accounts'
import { selectFeature } from '../models/ui'
import { PaywallUI } from '../components/PaywallUI'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationPage: React.FC = () => {
  const { permissions, feature, organization, thisOrganization } = useSelector((state: ApplicationState) => ({
    permissions: getActiveOrganizationPermissions(state),
    feature: selectFeature(state),
    organization: getActiveOrganizationMembership(state).organization,
    thisOrganization: state.organization,
  }))

  useEffect(() => {
    analyticsHelper.page('OrganizationPage')
  }, [])

  if (thisOrganization.initialized && !thisOrganization.id) return <Redirect to={'/organization/empty'} />

  const admin = !!permissions?.includes('ADMIN')

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{organization?.name || '...'}</Title>
        </Typography>
      }
    >
      {!admin && (
        <Notice severity="warning" gutterTop>
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
        <PaywallUI limitName="roles" title="Business plan required to use custom tag based roles and permissions.">
          <ListItemLocation
            title="Roles"
            icon="shield-alt"
            pathname={`/organization/roles/${organization?.roles.find(r => !r.disabled)?.id}`}
            disabled={!feature.roles || !admin}
            showDisabled
            dense
          />
        </PaywallUI>
        <PaywallUI limitName="saml" title="Business plan required for SAML or a custom Domain.">
          <ListItemLocation
            title="Settings"
            icon="sliders-h"
            pathname="/organization/saml"
            disabled={!feature.saml || !admin}
            showDisabled
            dense
          />
        </PaywallUI>
      </List>
    </Container>
  )
}
