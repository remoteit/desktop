import React, { useEffect, } from 'react'
import { List, Typography } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { selectLicenseIndicator, getRemoteitLicense } from '../../models/licensing'
import { ListItemLocation } from '../../components/ListItemLocation'
import { DeviceSetupItem } from '../../components/DeviceSetupItem'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { TestUI } from '../../components/TestUI'
import { Title } from '../../components/Title'
import analyticsHelper from '../../helpers/analyticsHelper'

export const SettingsPage: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const { billing, preferences, licenseIndicator, feature } = useSelector((state: ApplicationState) => ({
    billing: !!getRemoteitLicense(state)?.plan?.billing,
    licenseIndicator: selectLicenseIndicator(state),
    preferences: state.backend.preferences,
    feature: state.ui.feature,
  }))

  useEffect(() => {
    analyticsHelper.page('SettingsPage')
  }, [])

  if (!preferences) return null

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1" gutterBottom>
            <Title>Settings</Title>
            <OutOfBand inline />
          </Typography>
          <List disablePadding>
            <DeviceSetupItem />
          </List>
        </>
      }
    >
      <List>
        <ListItemLocation
          title="General"
          pathname="/settings/options"
          icon="sliders-h"
          match={['/settings', '/settings/options']}
          exactMatch
          dense
        />
        <ListItemLocation title="Logs" pathname="/settings/logs" icon="file-alt" dense />
        <ListItemLocation title="Scripting" pathname="https://app.remote.it/#scripting" icon="scroll" dense />
        <ListItemLocation title="Registrations" pathname="https://app.remote.it/#registrations" icon="upload" dense />
        <ListItemLocation title="Products" pathname="https://app.remote.it/#products" icon="server" dense />
        <ListItemLocation title="Notifications" pathname="/settings/notifications" icon="bell" dense />
        {feature.tagging && <ListItemLocation title="Tags" pathname="/settings/tags" icon="tag" dense />}
        <TestUI>
          <ListItemLocation title="Reports" pathname="/settings/reports" icon="chart-line" dense />
          <ListItemLocation title="Test Settings" pathname="/settings/test" icon="vial" dense />
        </TestUI>
      </List>
    </Container>
  )
}
