import React from 'react'
import { Dispatch, ApplicationState } from '../store'
import { Typography, List, ListItem, ListItemIcon } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ListItemSetting } from '../components/ListItemSetting'
import { Container } from '../components/Container'
import { TestUI } from '../components/TestUI'
import { getGraphQLApi, getRestApi, getWebSocketURL } from '../helpers/apiHelper'
import { Title } from '../components/Title'
import { Quote } from '../components/Quote'
import { emit } from '../services/Controller'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'

export const TestPage: React.FC = () => {
  const { tests, informed, preferences } = useSelector((state: ApplicationState) => ({
    ...state.licensing,
    preferences: state.backend.preferences,
  }))
  const { licensing, ui } = useDispatch<Dispatch>()
  const showStats = window.location.search === '?stats'

  const onSave = (url: string) => {
    emit('preferences', { ...preferences, apiGraphqlURL: url })
    emit('binaries/install')
    ui.refreshAll()
  }

  const onSaveRest = (url: string) => {
    emit('preferences', { ...preferences, apiURL: url })
    emit('binaries/install')
  }

  const onSaveWebSocket = (url: string) => {
    emit('preferences', { ...preferences, webSocketURL: url })
    emit('binaries/install')
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
          <ListItemSetting
            label={showStats ? 'Hide memory stats' : 'Show memory stats'}
            subLabel="The site will have to reload for changes to take effect. For best performance --enable-precise-memory-info."
            onClick={() => {
              if (showStats) window.location.href = '/'
              else window.location.href = '/?stats'
            }}
          />
          <ListItemSetting
            label="Override default APIs"
            onClick={() => emit('preferences', { ...preferences, switchApi: !preferences.switchApi })}
            toggle={!!preferences.switchApi}
          />
          <ListItem>
            <ListItemIcon />
            <Quote margin={0}>
              <InlineTextFieldSetting
                value={getGraphQLApi()}
                label="Switch GraphQL APIs"
                disabled={!preferences.switchApi}
                resetValue={getGraphQLApi()}
                maxLength={200}
                onSave={url => onSave(url.toString())}
                hideIcon
              />
              <InlineTextFieldSetting
                value={getRestApi()}
                label="Rest Api"
                disabled={!preferences.switchApi}
                resetValue={getRestApi()}
                maxLength={200}
                onSave={url => onSaveRest(url.toString())}
                hideIcon
              />
              <InlineTextFieldSetting
                value={getWebSocketURL()}
                label="WebSocket URL"
                disabled={!preferences.switchApi}
                resetValue={getWebSocketURL()}
                maxLength={200}
                onSave={url => onSaveWebSocket(url.toString())}
                hideIcon
              />
            </Quote>
          </ListItem>
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
