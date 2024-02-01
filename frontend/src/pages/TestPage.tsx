import React, { useState } from 'react'
import cloudSync from '../services/CloudSync'
import { TEST_HEADER } from '../constants'
import { Dispatch, ApplicationState } from '../store'
import { Typography, List, ListItem, Divider } from '@mui/material'
import { getGraphQLApi, getRestApi, getWebSocketURL } from '../helpers/apiHelper'
import { useSelector, useDispatch } from 'react-redux'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { selectLimitsLookup } from '../selectors/organizations'
import { ListItemSetting } from '../components/ListItemSetting'
import { selectLimits } from '../models/plans'
import { Container } from '../components/Container'
import { PortalUI } from '../components/PortalUI'
import { Title } from '../components/Title'
import { Quote } from '../components/Quote'
import { emit } from '../services/Controller'

export const TestPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const [testHeader, setTestHeader] = useState<string>(window.localStorage.getItem(TEST_HEADER) || '')
  const { tests, informed, apis, testUI, preferences, limits, limitsOverride } = useSelector(
    (state: ApplicationState) => ({
      ...state.plans,
      apis: state.ui.apis,
      testUI: state.ui.testUI,
      preferences: state.backend.preferences,
      limitsOverride: selectLimitsLookup(state, state.auth.user?.id),
      limits: selectLimits(state, state.auth.user?.id),
    })
  )

  async function setPreference(key: string, value: string | number | boolean) {
    await dispatch.ui.setPersistent({ apis: { ...apis, [key]: value } })
    emit('preferences', { preferences: { ...preferences, [key]: value } })
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
          toggle={testUI === 'ON'}
          onClick={() => dispatch.ui.setPersistent({ testUI: testUI === 'HIGHLIGHT' ? 'ON' : 'HIGHLIGHT' })}
        />
        <ListItemSetting
          hideIcon
          label="Disable Test UI"
          subLabel="To re-enable the alpha UI you will have to select the Avatar menu while holding alt-shift."
          onClick={() => {
            dispatch.ui.setPersistent({ testUI: undefined })
            emit('preferences', { ...preferences, allowPrerelease: false, switchApi: false })
          }}
        />

        <PortalUI>
          <InlineTextFieldSetting
            value={testHeader}
            label="Add query header"
            displayValue={testHeader}
            placeholder='Example: "key:value"'
            multiline={false}
            resetValue=""
            maxLength={200}
            onSave={result => {
              window.localStorage.setItem(TEST_HEADER, result.toString())
              setTestHeader(result.toString())
            }}
            hideIcon
          />
        </PortalUI>

        <ListItemSetting
          hideIcon
          label="Override default APIs"
          onClick={() => {
            setPreference('switchApi', !apis.switchApi)
            emit('binaries/install')
          }}
          toggle={!!apis.switchApi}
        />
        <ListItem>
          <Quote margin={null} indent="listItem" noInset>
            <List disablePadding>
              <InlineTextFieldSetting
                value={getGraphQLApi()}
                label="Switch GraphQL APIs"
                disabled={!apis.switchApi}
                resetValue={getGraphQLApi()}
                maxLength={200}
                onSave={url => {
                  setPreference('apiGraphqlURL', url)
                  emit('binaries/install')
                  cloudSync.all()
                }}
                hideIcon
              />
              {/* <InlineTextFieldSetting
                value={getRestApi()}
                displayValue="This still needs to be hooked up"
                label="Rest Api"
                disabled={true || !apis.switchApi}
                resetValue={getRestApi()}
                maxLength={200}
                onSave={url => {
                  setPreference('apiURL', url)
                  emit('binaries/install')
                }}
                hideIcon
              /> */}
              <InlineTextFieldSetting
                value={getWebSocketURL()}
                label="WebSocket URL"
                disabled={!apis.switchApi}
                resetValue={getWebSocketURL()}
                maxLength={200}
                onSave={url => {
                  setPreference('webSocketURL', url)
                  emit('binaries/install')
                }}
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
                  dispatch.ui.setPersistent({
                    limitsOverride: { ...limitsOverride, [l.name]: !limitsOverride[l.name] },
                  })
                }
              />
            )
        })}
        <Divider variant="inset" />
        <ListItemSetting
          hideIcon
          button="Reset"
          label="Reset feature overrides"
          onButtonClick={() => dispatch.ui.setPersistent({ limitsOverride: {} })}
        />
      </List>
      <Typography variant="subtitle1">Licensing Options</Typography>
      <List>
        <ListItemSetting
          hideIcon
          label="Override licenses and limits"
          toggle={tests.limit}
          onClick={() => dispatch.plans.set({ tests: { ...tests, limit: !tests.limit, license: !tests.license } })}
        />
        <ListItemSetting
          hideIcon
          label="Set service licenses"
          subLabel="Will set all devices licensing in order to: UNKNOWN, EVALUATION, LICENSED, UNLICENSED, NON_COMMERCIAL, LEGACY"
          onClick={() => dispatch.plans.testServiceLicensing()}
        />
        <ListItemSetting
          hideIcon
          label="License message cleared"
          toggle={informed}
          onClick={() => dispatch.plans.set({ informed: !informed })}
        />
      </List>
    </Container>
  )
}
