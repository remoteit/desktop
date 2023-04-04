import React from 'react'
import { List, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { ListItemLocation } from '../../components/ListItemLocation'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { TestUI } from '../../components/TestUI'
import { Title } from '../../components/Title'

export const SettingsPage: React.FC = () => {
  const { preferences } = useSelector((state: ApplicationState) => state.backend)

  if (!preferences) return null

  return (
    <Container
      gutterBottom
      header={
        <Gutters>
          <Typography variant="h2">
            <Title>Settings</Title>
            <OutOfBand inline />
          </Typography>
        </Gutters>
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
        <ListItemLocation title="Tags" pathname="/settings/tags" icon="tag" showDisabled dense />
        <ListItemLocation title="Notifications" pathname="/settings/notifications" icon="bell" dense />
        <ListItemLocation
          title="Connection Type Defaults"
          pathname="/settings/defaults"
          icon="object-intersect"
          dense
        />
        <TestUI>
          <ListItemLocation title="Reports" pathname="/settings/reports" icon="chart-line" dense />
          <ListItemLocation title="Test Settings" pathname="/settings/test" icon="vial" dense />
        </TestUI>
      </List>
    </Container>
  )
}
