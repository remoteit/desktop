import React from 'react'
import { Dispatch, ApplicationState } from '../store'
import { Typography, List, ListItem, Divider } from '@material-ui/core'
import { getGraphQLApi, getRestApi, getWebSocketURL } from '../helpers/apiHelper'
import { useSelector, useDispatch } from 'react-redux'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { selectBaseLimits } from '../models/plans'
import { ListItemSetting } from '../components/ListItemSetting'
import { selectLimitsLookup } from '../models/organization'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Quote } from '../components/Quote'
import { emit } from '../services/Controller'

export const TestPage: React.FC = () => {
  const { tests, informed, preferences, limits, limitsOverride } = useSelector((state: ApplicationState) => ({
    ...state.plans,
    preferences: state.backend.preferences,
    limitsOverride: selectLimitsLookup(state, state.auth.user?.id),
    limits: selectBaseLimits(state, state.auth.user?.id),
  }))
  const { plans, ui } = useDispatch<Dispatch>()

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

  const onToggleAPIs = () => {
    emit('preferences', { ...preferences, switchApi: !preferences.switchApi })
    emit('binaries/install')
  }

  return (
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
          hideIcon
          label="Hide test UI backgrounds"
          toggle={preferences.testUI === 'ON'}
          onClick={() =>
            emit('preferences', { ...preferences, testUI: preferences.testUI === 'HIGHLIGHT' ? 'ON' : 'HIGHLIGHT' })
          }
        />
        <ListItemSetting
          hideIcon
          label="Disable Test UI"
          subLabel="To re-enable the alpha UI you will have to select the Avatar menu while holding alt-shift."
          onClick={() =>
            emit('preferences', { ...preferences, testUI: 'OFF', allowPrerelease: false, switchApi: false })
          }
        />
        <ListItemSetting
          hideIcon
          label="Override default APIs"
          onClick={onToggleAPIs}
          toggle={!!preferences.switchApi}
        />
        <ListItem>
          <Quote margin={null} listItem noInset>
            <List disablePadding>
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
            </List>
          </Quote>
        </ListItem>
      </List>
      <Typography variant="subtitle1">Features</Typography>
      <List>
        {limits.map(l => {
          if (typeof l.value === 'boolean')
            return (
              <ListItemSetting
                hideIcon
                key={l.name}
                label={`${l.name} (default ${l.value ? 'enabled' : 'disabled'})`}
                toggle={limitsOverride[l.name]}
                onClick={() =>
                  ui.setPersistent({ limitsOverride: { ...limitsOverride, [l.name]: !limitsOverride[l.name] } })
                }
              />
            )
        })}
        <Divider variant="inset" />
        <ListItemSetting
          hideIcon
          button="Reset"
          label="Reset feature overrides"
          onButtonClick={() => ui.setPersistent({ limitsOverride: {} })}
        />
      </List>
      <Typography variant="subtitle1">Licensing Options</Typography>
      <List>
        <ListItemSetting
          hideIcon
          label="Override licenses and limits"
          toggle={tests.limit}
          onClick={() => plans.set({ tests: { ...tests, limit: !tests.limit, license: !tests.license } })}
        />
        <ListItemSetting hideIcon label="Clear licenses and limits" onClick={() => plans.testClearLicensing()} />
        <ListItemSetting
          hideIcon
          label="Set service licenses"
          subLabel="Will set all devices licensing in order to: UNKNOWN, EVALUATION, LICENSED, UNLICENSED, NON_COMMERCIAL, LEGACY"
          onClick={() => plans.testServiceLicensing()}
        />
        <ListItemSetting
          hideIcon
          label="License message cleared"
          toggle={informed}
          onClick={() => plans.set({ informed: !informed })}
        />
      </List>
    </Container>
  )
}
