import React, { useEffect } from 'react'
import { List, Typography, Tooltip, ButtonBase } from '@material-ui/core'
import { getRemoteitLicense, selectLicenseIndicator } from '../models/licensing'
import { ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { useSelector } from 'react-redux'
import { windowOpen } from '../services/Browser'
import { Container } from '../components/Container'
import { Logo } from '../components/Logo'
import analyticsHelper from '../helpers/analyticsHelper'

export const AccountPage: React.FC = () => {
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
            <Tooltip title="Visit remote.it on the web">
              <ButtonBase onClick={() => windowOpen('https://remote.it')}>
                <Logo width={110} />
              </ButtonBase>
            </Tooltip>
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
        <ListItemLocation title="Organization" pathname="/account/organization" icon="industry-alt" exactMatch dense />
        <ListItemLocation title="Subscription" pathname="/account/plans" icon="shopping-cart" dense />
        {billing && <ListItemLocation title="Billing" pathname="/account/billing" icon="credit-card-front" dense />}
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
