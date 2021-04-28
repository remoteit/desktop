import React, { useEffect } from 'react'
import { Dispatch, ApplicationState } from '../store'
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  IconButton,
} from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { InlineSelectSetting } from '../components/InlineSelectSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { TestUI } from '../components/TestUI'
import { Title } from '../components/Title'
import { emit } from '../services/Controller'

export const TestPage: React.FC = () => {
  const { tests, informed, preferences } = useSelector((state: ApplicationState) => ({
    ...state.licensing,
    preferences: state.backend.preferences,
  }))
  const { licensing } = useDispatch<Dispatch>()

  return (
    <TestUI>
      <Container
        header={
          <Typography variant="h1">
            <Title>Test Settings</Title>
          </Typography>
        }
      >
        <Typography variant="subtitle1">Test Options</Typography>
        <List>
          <ListItemSetting
            label="Hide test UI backgrounds"
            toggle={preferences.testUI === 'ON'}
            onClick={() =>
              emit('preferences', { ...preferences, testUI: preferences.testUI === 'HIGHLIGHT' ? 'ON' : 'HIGHLIGHT' })
            }
          />
          <ListItemSetting
            label="Disable Test UI"
            subLabel="To re-enable the alpha UI you will have to select the Avatar menu while holding alt-shift."
            onClick={() =>
              emit('preferences', { ...preferences, testUI: 'OFF', allowPrerelease: false, switchApi: false })
            }
          />
        </List>
        <Typography variant="subtitle1">Licensing Options</Typography>
        <List>
          <ListItemSetting
            label="Override licenses and limits"
            toggle={tests.limit}
            onClick={() => licensing.set({ tests: { ...tests, limit: !tests.limit, license: !tests.license } })}
          />
          <ListItemSetting label="Clear licenses and limits" onClick={() => licensing.testClearLicensing()} />
          <ListItemSetting
            label="Set service licenses"
            subLabel="Will set all devices licensing in order to: UNKNOWN, EVALUATION, LICENSED, UNLICENSED, NON_COMMERCIAL, LEGACY"
            onClick={() => licensing.testServiceLicensing()}
          />
          <ListItemSetting
            label="License message cleared"
            toggle={informed}
            onClick={() => licensing.set({ informed: !informed })}
          />
        </List>
      </Container>
    </TestUI>
  )
}
