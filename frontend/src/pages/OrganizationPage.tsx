import React from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { List, Typography, Box } from '@mui/material'
import { Redirect, useParams } from 'react-router-dom'
import { selectLicenseIndicator } from '../models/plans'
import {
  selectRemoteitLicense,
  selectPermissions,
  selectLimitsLookup,
  selectOrganization,
} from '../selectors/organizations'
import { selectActiveUser } from '../selectors/accounts'
import { PlanActionChip } from '../components/PlanActionChip'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'

export const OrganizationPage: React.FC = () => {
  const { userID = '', deviceID = '' } = useParams<{ userID: string; deviceID: string }>()
  const user = useSelector((state: State) => state.user)
  const initialized = useSelector((state: State) => state.organization.initialized)
  const organization = useSelector(selectOrganization)
  const owner = useSelector(selectActiveUser)
  const permissions = useSelector(selectPermissions)
  const limits = useSelector(selectLimitsLookup)
  const license = useSelector(selectRemoteitLicense)
  const licenseIndicator = useSelector(selectLicenseIndicator)
  const admin = !!permissions?.includes('ADMIN')
  const manager = !!permissions?.includes('MANAGE')

  if (initialized && !organization.id)
    return <Redirect to={{ pathname: '/organization/empty', state: { isRedirect: true } }} />

  return (
    <Container
      gutterBottom
      header={
        <Gutters top={null} size="lg">
          <Box display="flex" alignItems="center" marginTop={2}>
            <Avatar email={owner.email} fallback={organization.name} size={46} inline />
            <Box width="100%">
              {license && (
                <Typography variant="subtitle2">
                  <Title>{license?.plan.description} Plan</Title>
                  <PlanActionChip />
                </Typography>
              )}
              <Typography variant="h2">
                <Title>{organization.name || '...'}</Title>
              </Typography>
            </Box>
          </Box>
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
          to="/organization/members"
          icon="users"
          match={[
            '/organization',
            '/organization/members',
            `/organization/members/${userID}`,
            `/organization/members/${userID}/${deviceID}`,
          ]}
          disabled={!admin}
          exactMatch
          showDisabled
          dense
        />
        {organization.reseller && (
          <ListItemLocation
            title="Customers"
            to="/organization/customer"
            icon="address-book"
            disabled={!admin}
            showDisabled
            dense
          />
        )}
        <ListItemLocation
          title="Guests"
          to="/organization/guests"
          icon="user-circle"
          disabled={!manager}
          showDisabled
          dense
        />
        <ListItemLocation
          title="Account"
          to={`/organization/account/${user.id}`}
          match={['/organization/account']}
          icon="user"
          dense
        />
        <ListItemLocation
          title="Roles"
          icon="user-shield"
          to="/organization/roles"
          disabled={!admin}
          showDisabled
          dense
        />
        <ListItemLocation
          title="Tags"
          to="/organization/tags"
          icon="tag"
          disabled={!limits.tagging || !admin}
          showDisabled
          dense
        />
        <ListItemLocation
          title="License"
          to="/organization/licensing"
          icon="id-badge"
          disabled={!license}
          badge={licenseIndicator}
          showDisabled
          dense
        />
        <ListItemLocation
          title="Settings"
          icon="sliders-h"
          to="/organization/settings"
          disabled={!admin}
          showDisabled
          dense
        />
      </List>
    </Container>
  )
}
