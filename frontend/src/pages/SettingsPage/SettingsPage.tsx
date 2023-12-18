import React from 'react'
import { List, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { ListItemLocation } from '../../components/ListItemLocation'
import { selectLimitsLookup } from '../../selectors/organizations'
import { OutOfBand } from '../../components/OutOfBand'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { TestUI } from '../../components/TestUI'
import { Title } from '../../components/Title'

export const SettingsPage: React.FC = () => {
  const { preferences, feature } = useSelector((state: ApplicationState) => ({
    preferences: state.backend,
    feature: selectLimitsLookup(state),
  }))

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
          to="/settings/options"
          icon="browser"
          match={['/settings', '/settings/options']}
          exactMatch
          dense
        />
        {feature.tagging && <ListItemLocation title="Tags" to="/settings/tags" icon="tag" showDisabled dense />}
        <ListItemLocation title="Graphs" to="/settings/graphs" icon="chart-column" dense />
        <ListItemLocation title="Notifications" to="/settings/notifications" icon="bell" dense />
        <ListItemLocation title="Connection Type Defaults" to="/settings/defaults" icon="object-intersect" dense />
        <TestUI>
          <ListItemLocation title="Reports" to="/settings/reports" icon="chart-line" dense />
          <ListItemLocation title="Test Settings" to="/settings/test" icon="vial" dense />
        </TestUI>
      </List>
    </Container>
  )
}
