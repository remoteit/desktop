import React, { useEffect } from 'react'
import { List, Typography } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { getRemoteitLicense, selectLicenseIndicator } from '../../models/licensing'
import { ListItemLocation } from '../../components/ListItemLocation'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import analyticsHelper from '../../helpers/analyticsHelper'

export const SettingsAccountPage: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const { billing, preferences, licenseIndicator } = useSelector((state: ApplicationState) => ({
    billing: !!getRemoteitLicense(state)?.plan?.billing,
    licenseIndicator: selectLicenseIndicator(state),
    preferences: state.backend.preferences,
  }))

  useEffect(() => {
    analyticsHelper.page('SettingsAccountPage')
  }, [])

  if (!preferences) return null

  return (
    <Container
      bodyProps={{ style: { with: 300 } }}
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>
              Account
            </Title>
          </Typography>
        </>
      }
    >
      <List>
        <ListItemLocation title="Overviews" pathname="/settingsAccount/overview" icon="home" match={['/settingsAccount', '/settingsAccount/overview']} dense />
        <ListItemLocation title="Security & Login" pathname="/settingsAccount/security" icon="file-alt" dense />
        <ListItemLocation title="Notifications" pathname="/settingsAccount/notifications" icon="bell" dense />
        <ListItemLocation title="Licensing" pathname="/settingsAccount/licensing" icon="id-badge" badge={licenseIndicator} dense />
        <ListItemLocation title="Subscriptions" pathname="/settingsAccount/plans" icon="shopping-cart" dense />
        {billing && (<ListItemLocation title="Transactions" pathname="/settingsAccount/billing" icon="receipt" dense />)}
        <ListItemLocation title="Access Keys" pathname="/settingsAccount/accessKey" icon="puzzle-piece" dense />

      </List>
    </Container>
  )
}

