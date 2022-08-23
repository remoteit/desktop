import React, { useEffect } from 'react'
import { List, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { ListItemLocation } from '../../components/ListItemLocation'
import { DeviceSetupItem } from '../../components/DeviceSetupItem'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { TestUI } from '../../components/TestUI'
import { Title } from '../../components/Title'
import analyticsHelper from '../../helpers/analyticsHelper'

export const SettingsPage: React.FC = () => {
  const { preferences } = useSelector((state: ApplicationState) => ({
    preferences: state.backend.preferences,
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
          <Gutters bottom={null}>
            <Typography variant="h2">
              <Title>Settings</Title>
              <OutOfBand inline />
            </Typography>
          </Gutters>
          <List>
            <DeviceSetupItem />
          </List>
        </>
      }
    >
      <List>
        <ListItemLocation
          title="Application"
          pathname="/settings/options"
          icon="browser"
          match={['/settings', '/settings/options']}
          exactMatch
          dense
        />
        <ListItemLocation title="Notifications" pathname="/settings/notifications" icon="bell" dense />
        <ListItemLocation title="Connection Defaults" pathname="/settings/defaults" icon="square-dashed" dense />
        <TestUI>
          <ListItemLocation title="Reports" pathname="/settings/reports" icon="chart-line" dense />
          <ListItemLocation title="Test Settings" pathname="/settings/test" icon="vial" dense />
        </TestUI>
      </List>
    </Container>
  )
}
