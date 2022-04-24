import React, { useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { List, Typography } from '@material-ui/core'
import { ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { getOrganizationPermissions, getOrganization } from '../models/organization'
import { selectFeature } from '../models/ui'
import { PaywallUI } from '../components/PaywallUI'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationPage: React.FC = () => {
  const { initialized, permissions, feature, organization } = useSelector((state: ApplicationState) => ({
    initialized: state.organization.initialized,
    permissions: getOrganizationPermissions(state),
    feature: selectFeature(state),
    organization: getOrganization(state),
  }))

  useEffect(() => {
    analyticsHelper.page('OrganizationPage')
  }, [])

  if (initialized && !organization.id) return <Redirect to={'/organization/empty'} />

  const admin = !!permissions?.includes('ADMIN')
  // const license = organization?.licenses?.find(l => l.subscription?.status === 'ACTIVE')
  // const plan = license?.plan

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{organization.name || '...'}</Title>
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
        <PaywallUI limitName="tagging" title="Business plan required to use custom tag based roles and permissions.">
          <ListItemLocation
            title="Tags"
            pathname="/organization/tags"
            icon="tag"
            disabled={!feature.tagging || !admin}
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
