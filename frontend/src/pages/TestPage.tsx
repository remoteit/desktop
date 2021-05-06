import React from 'react'
import { Dispatch, ApplicationState } from '../store'
import { Typography, List } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ListItemSetting } from '../components/ListItemSetting'
import { Container } from '../components/Container'
import { TestUI } from '../components/TestUI'
import { getApiURL } from '../services/graphQL'
import { Title } from '../components/Title'
import { emit } from '../services/Controller'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'

export const TestPage: React.FC = () => {
  const { tests, informed, preferences } = useSelector((state: ApplicationState) => ({
    ...state.licensing,
    preferences: state.backend.preferences,
  }))
  const { licensing, ui } = useDispatch<Dispatch>()

  const onSave = (url: string) => {
    emit('preferences', { ...preferences, apiGraphqlURL: url })
    emit('binaries/update-api-url', { apiURL: getApiURL(true), apiGraphqlURL: url })
    ui.refreshAll()
  }

  const onSaveRest = (url: string) => {
    emit('preferences', { ...preferences, apiURL: url })
    emit('binaries/update-api-url', { apiURL: url, apiGraphqlURL: getApiURL() })
  }

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

          <InlineTextFieldSetting
            value={getApiURL()}
            label="Switch GraphQL APIs"
            disabled={false}
            resetValue={getApiURL()}
            maxLength={200}
            onSave={url => onSave(url.toString())}
          />

          <InlineTextFieldSetting
            value={getApiURL(true)}
            label="Rest Api"
            disabled={false}
            resetValue={getApiURL(true)}
            maxLength={200}
            onSave={url => onSaveRest(url.toString())}
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
