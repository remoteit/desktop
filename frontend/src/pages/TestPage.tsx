import React from 'react'
import { TEST_HEADER } from '../shared/constants'
import { Dispatch, ApplicationState } from '../store'
import { Typography, List, ListItem, Divider } from '@mui/material'
import { getGraphQLApi, getRestApi, getWebSocketURL } from '../helpers/apiHelper'
import { useSelector, useDispatch } from 'react-redux'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { selectBaseLimits } from '../models/plans'
import { ListItemSetting } from '../components/ListItemSetting'
import { selectLimitsLookup } from '../selectors/organizations'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Quote } from '../components/Quote'
import { emit } from '../services/Controller'

export const TestPage: React.FC = () => {
  const { plans, ui } = useDispatch<Dispatch>()
  const { tests, informed, testUI, unExpireBubbles, preferences, limits, limitsOverride, testHeader } = useSelector(
    (state: ApplicationState) => ({
      ...state.plans,
      testUI: state.ui.testUI,
      unExpireBubbles: state.ui.unExpireBubbles,
      preferences: state.backend.preferences,
      limitsOverride: selectLimitsLookup(state, state.auth.user?.id),
      limits: selectBaseLimits(state, state.auth.user?.id),
      testHeader: window.localStorage.getItem(TEST_HEADER) || '',
    })
  )

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
          toggle={testUI === 'ON'}
          onClick={() => ui.setPersistent({ testUI: testUI === 'HIGHLIGHT' ? 'ON' : 'HIGHLIGHT' })}
        />
        <ListItemSetting
          hideIcon
          label="Disable Test UI"
          subLabel="To re-enable the alpha UI you will have to select the Avatar menu while holding alt-shift."
          onClick={() => {
            ui.setPersistent({ testUI: 'OFF' })
            emit('preferences', { ...preferences, allowPrerelease: false, switchApi: false })
          }}
        />

        <InlineTextFieldSetting
          value={testHeader}
          label="Add query header"
          displayValue={testHeader ? undefined : "<empty> Enter header as 'key:value'"}
          resetValue=""
          maxLength={200}
          onSave={result => window.localStorage.setItem(TEST_HEADER, result.toString())}
          hideIcon
        />

        <ListItemSetting
          hideIcon
          label="Override default APIs"
          onClick={() => {
            emit('preferences', { ...preferences, switchApi: !preferences.switchApi })
            emit('binaries/install')
          }}
          toggle={!!preferences.switchApi}
        />
        <ListItem>
          <Quote margin={null} indent="listItem" noInset>
            <List disablePadding>
              <InlineTextFieldSetting
                value={getGraphQLApi()}
                label="Switch GraphQL APIs"
                disabled={!preferences.switchApi}
                resetValue={getGraphQLApi()}
                maxLength={200}
                onSave={url => {
                  emit('preferences', { ...preferences, apiGraphqlURL: url })
                  emit('binaries/install')
                  ui.refreshAll()
                }}
                hideIcon
              />
              <InlineTextFieldSetting
                value={getRestApi()}
                label="Rest Api"
                disabled={!preferences.switchApi}
                resetValue={getRestApi()}
                maxLength={200}
                onSave={url => {
                  emit('preferences', { ...preferences, apiURL: url })
                  emit('binaries/install')
                }}
                hideIcon
              />
              <InlineTextFieldSetting
                value={getWebSocketURL()}
                label="WebSocket URL"
                disabled={!preferences.switchApi}
                resetValue={getWebSocketURL()}
                maxLength={200}
                onSave={url => {
                  emit('preferences', { ...preferences, webSocketURL: url })
                  emit('binaries/install')
                }}
                hideIcon
              />
            </List>
          </Quote>
        </ListItem>
        <ListItemSetting
          hideIcon
          label="Display expired guide bubbles"
          toggle={unExpireBubbles}
          onClick={() => ui.set({ unExpireBubbles: !unExpireBubbles })}
        />
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
