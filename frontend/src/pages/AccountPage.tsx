import React, { useEffect } from 'react'
import { List, Typography } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { getRemoteitLicense, selectLicenseIndicator } from '../models/licensing'
import { ListItemLocation } from '../components/ListItemLocation'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const AccountPage: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const { billing, preferences, licenseIndicator } = useSelector((state: ApplicationState) => ({
    billing: !!getRemoteitLicense(state)?.plan?.billing,
    licenseIndicator: selectLicenseIndicator(state),
    preferences: state.backend.preferences,
  }))

  useEffect(() => {
    analyticsHelper.page('AccountPage')
  }, [])

  if (!preferences) return null

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Account</Title>
          </Typography>
        </>
      }
    >
      <List>
        <ListItemLocation
          title="Profile"
          pathname="/account/overview"
          match={['/account', '/account/overview']}
          icon="user"
          exactMatch
          dense
        />
        <ListItemLocation title="Security" pathname="/account/security" icon="lock" dense />
        <ListItemLocation title="Notifications" pathname="/account/notifications" icon="bell" dense />
        <ListItemLocation title="Subscription" pathname="/account/plans" icon="shopping-cart" dense />
        {billing && <ListItemLocation title="Transactions" pathname="/account/billing" icon="receipt" dense />}
        <ListItemLocation
          title="Licensing"
          pathname="/account/licensing"
          icon="id-badge"
          badge={licenseIndicator}
          dense
        />
        <ListItemLocation title="Access Keys" pathname="/account/accessKey" icon="key" dense />
      </List>
    </Container>
  )
}
