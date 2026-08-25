import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import cloudSync from '../services/CloudSync'
import { TEST_HEADER, OAUTH_GRAPHQL_RESOURCE } from '../constants'
import { Dispatch, State } from '../store'
import { Typography, List, ListItem, Divider } from '@mui/material'
import { getApiURL, getWebSocketURL } from '../helpers/apiHelper'
import { bindableResources } from '../services/permitteerAccount'
import { oidcAccessToken } from '../services/oidc'
import { selectLimitsLookup, selectLimits } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { ListItemRadio } from '../components/ListItemRadio'
import { Container } from '../components/Container'
import { PortalUI } from '../components/PortalUI'
import { Title } from '../components/Title'
import { Quote } from '../components/Quote'
import { emit } from '../services/Controller'
import { isSecureAgentURL, backgroundConnectUrl, backgroundStatus, backgroundDisable } from '../services/agent'
import { windowOpen } from '../services/browser'

export const TestPage: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const [testHeader, setTestHeader] = useState<string>(window.localStorage.getItem(TEST_HEADER) || '')
  const { tests, informed } = useSelector((state: State) => state.plans)
  const apis = useSelector((state: State) => state.ui.apis)
  const testUI = useSelector((state: State) => state.ui.testUI)
  const preferences = useSelector((state: State) => state.backend.preferences)
  const limitsOverride = useSelector(selectLimitsLookup)
  const limits = useSelector(selectLimits)

  async function setAPIPreference(key: string, value: string | number | boolean) {
    await dispatch.ui.setPersistent({ apis: { ...apis, [key]: value } })
    emit('preferences', { ...preferences, [key]: value })
  }

  // Agent overrides are browser-only (the chat never touches the desktop
  // backend), so no preference emit
  async function setAgentPreference(key: string, value: string | boolean) {
    await dispatch.ui.setPersistent({ apis: { ...apis, [key]: value } })
  }

  // Background work (permitteer docs/remoteit-ai-agent.md D6): the agent's own, narrower
  // grant — enrollment is a browser ceremony at the AS; this page only reads/ends it.
  const [backgroundEnrolled, setBackgroundEnrolled] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    backgroundStatus().then(setBackgroundEnrolled)
  }, [])
  async function connectBackground() {
    await windowOpen(backgroundConnectUrl(), '_blank', true)
    // The ceremony finishes in the browser — poll briefly for the verdict.
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000))
      if (await backgroundStatus()) break
    }
    setBackgroundEnrolled(await backgroundStatus())
  }
  async function disableBackground() {
    await backgroundDisable()
    setBackgroundEnrolled(await backgroundStatus())
  }

  // --- the stage-pair switcher (D10+D11a, permitteer docs/remoteit-desktop-login.md 4c) ----
  // The options come FROM the AS: the client's own allowlist joined to registry names, so the
  // picker and the mint-time guardrail can never disagree. Identifiers group into stage pairs
  // (graphql + events); one selection sets BOTH URLs and mints BOTH audiences immediately, so
  // an illegal target fails here with a legible error, never as ambient 403s an hour later.
  const [targets, setTargets] = useState<Array<{ identifier: string; name: string }>>([])
  const [mintError, setMintError] = useState<string>('')
  useEffect(() => {
    bindableResources().then(setTargets)
  }, [])

  type StagePair = { stage: string; name: string; graphql?: string; ws?: string }
  const stagePairs: StagePair[] = React.useMemo(() => {
    const pairs = new Map<string, StagePair>()
    for (const target of targets) {
      const gql = target.identifier.match(/^https:\/\/graphql(?:\.([a-z0-9-]+))?\.remote\.it\/graphql$/)
      const ws = target.identifier.match(/^wss:\/\/ws(?:\.([a-z0-9-]+))?\.remote\.it\/v1$/)
      if (!gql && !ws) continue // passport / account-api entries are not switch targets
      const stage = (gql?.[1] ?? ws?.[1]) || 'prod'
      const pair = pairs.get(stage) || { stage, name: stage }
      if (gql) {
        pair.graphql = target.identifier
        pair.name = target.name
      } else pair.ws = target.identifier
      pairs.set(stage, pair)
    }
    return [...pairs.values()].filter(pair => pair.graphql)
  }, [targets])

  // Which radio is lit. The override flag is DERIVED from the choice — selecting the stage
  // this build ships with is the same thing the old "Override default APIs" switch expressed,
  // so the switch is gone and `switchApi` (still read by the Electron backend to configure
  // the CLI binary) is set from here. `customMode` is held locally because a hand-typed URL
  // may coincide with a registered stage, and the choice should not silently jump to it.
  const currentGraphql = apis.switchApi && apis.apiGraphqlURL ? apis.apiGraphqlURL : OAUTH_GRAPHQL_RESOURCE
  const [customMode, setCustomMode] = useState<boolean | undefined>(undefined)
  const customSelected =
    customMode ?? (!!apis.switchApi && stagePairs.length > 0 && !stagePairs.some(p => p.graphql === currentGraphql))

  async function selectCustom() {
    setMintError('')
    setCustomMode(true)
    const values = {
      switchApi: true,
      apiGraphqlURL: apis.apiGraphqlURL || getApiURL() || '',
      webSocketURL: apis.webSocketURL || getWebSocketURL() || '',
    }
    await dispatch.ui.setPersistent({ apis: { ...apis, ...values } })
    emit('preferences', { ...preferences, ...values })
  }

  async function selectStage(pair: StagePair) {
    setMintError('')
    setCustomMode(false)
    const isDefault = pair.graphql === OAUTH_GRAPHQL_RESOURCE
    const values = {
      switchApi: !isDefault,
      apiGraphqlURL: pair.graphql!,
      ...(pair.ws ? { webSocketURL: pair.ws } : {}),
    }
    await dispatch.ui.setPersistent({ apis: { ...apis, ...values } })
    emit('preferences', { ...preferences, ...values })
    try {
      if (!isDefault) {
        await oidcAccessToken(pair.graphql!)
        if (pair.ws) await oidcAccessToken(pair.ws)
      }
      emit('binaries/install')
      cloudSync.all()
    } catch (error) {
      setMintError(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <Container
      header={
        <Typography variant="h1">
          <Title>{t('testPage.title', 'Test Settings')}</Title>
        </Typography>
      }
    >
      <Typography variant="subtitle1">{t('testPage.testOptions', 'Test Options')}</Typography>
      <List>
        <ListItemSetting
          hideIcon
          label={t('testPage.disableTestUI', 'Disable Test UI')}
          subLabel={t(
            'testPage.disableTestUIHint',
            'To re-enable the alpha UI you will have to select the Avatar menu while holding alt-shift.'
          )}
          onClick={() => {
            dispatch.ui.setPersistent({ testUI: undefined })
            emit('preferences', { ...preferences, allowPrerelease: false, switchApi: false })
          }}
        />
        <ListItemSetting
          hideIcon
          label={t('testPage.hideTestUIBackgrounds', 'Hide test UI backgrounds')}
          toggle={testUI === 'ON'}
          onClick={() => dispatch.ui.setPersistent({ testUI: testUI === 'HIGHLIGHT' ? 'ON' : 'HIGHLIGHT' })}
        />
        <ListItemSetting
          hideIcon
          label={t('testPage.showLatestAnnouncement', 'Show latest announcement')}
          subLabel={t(
            'testPage.showLatestAnnouncementHint',
            'Previews the latest announcement without changing its read status.'
          )}
          onClick={() => {
            dispatch.ui.set({ announcementPresentationTest: Date.now() })
            dispatch.announcements.fetch().catch(error => console.warn('Failed to refresh announcements', error))
          }}
        />
        <ListItemSetting
          hideIcon
          label={t('testPage.clearViewedAnnouncements', 'Clear viewed announcements')}
          subLabel={t('testPage.clearViewedAnnouncementsHint', 'Marks all loaded announcements unread for this account.')}
          onClick={() => dispatch.announcements.clearRead()}
        />
        <PortalUI>
          <InlineTextFieldSetting
            value={testHeader}
            label={t('testPage.addQueryHeader', 'Add query header')}
            displayValue={testHeader}
            placeholder={t('testPage.addQueryHeaderPlaceholder', 'Example: "key:value"')}
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
      </List>

      <Typography variant="subtitle1">{t('testPage.apiTarget', 'API Target')}</Typography>
      <List>
        {stagePairs.map(pair => (
          <ListItemRadio
            key={pair.stage}
            label={pair.name}
            subLabel={pair.ws ? `${pair.graphql} + events` : pair.graphql}
            checked={!customSelected && currentGraphql === pair.graphql}
            onClick={() => selectStage(pair)}
          />
        ))}
        <ListItemRadio
          label={t('testPage.customAPITarget', 'Custom')}
          subLabel={t('testPage.customAPITargetHint', 'Point at a URL the authorization server has not registered.')}
          checked={customSelected}
          onClick={selectCustom}
        />
        {!!mintError && (
          <ListItem>
            <Typography variant="caption" color="error">
              {t('testPage.mintError', 'This target was refused at token mint: {{error}}', {
                error: mintError,
              })}
            </Typography>
          </ListItem>
        )}
        <ListItem>
          <Quote margin={null} indent="listItem" noInset>
            <List disablePadding>
              <InlineTextFieldSetting
                value={getApiURL()}
                label={t('testPage.customGraphQLURL', 'Custom GraphQL URL (advanced)')}
                disabled={!customSelected}
                resetValue={getApiURL()}
                maxLength={200}
                onSave={async result => {
                  const url = result.toString()
                  setMintError('')
                  await setAPIPreference('apiGraphqlURL', url)
                  try {
                    await oidcAccessToken(url)
                  } catch (error) {
                    setMintError(error instanceof Error ? error.message : String(error))
                  }
                  emit('binaries/install')
                  cloudSync.all()
                }}
                hideIcon
              />
              <InlineTextFieldSetting
                value={getWebSocketURL()}
                label={t('testPage.customWebSocketURL', 'Custom WebSocket URL (advanced)')}
                disabled={!customSelected}
                resetValue={getWebSocketURL()}
                maxLength={200}
                onSave={url => {
                  setAPIPreference('webSocketURL', url)
                  emit('binaries/install')
                }}
                hideIcon
              />
            </List>
          </Quote>
        </ListItem>
        <ListItemSetting
          hideIcon
          label={t('testPage.overrideAgent', 'Override agent service')}
          subLabel={t(
            'testPage.overrideAgentSub',
            'Point the Mycal chat at a deployed agent (https only). Auth rides your app session either way — the token is minted for the agent audience, so the target must trust this stage.'
          )}
          onClick={() => setAgentPreference('switchAgent', !apis.switchAgent)}
          toggle={!!apis.switchAgent}
        />
        <ListItem>
          <Quote margin={null} indent="listItem" noInset>
            <List disablePadding>
              <InlineTextFieldSetting
                value={apis.agentURL || ''}
                label={t('testPage.agentURL', 'Agent service URL')}
                placeholder="https://dev-ai-agent.remote.it"
                disabled={!apis.switchAgent}
                resetValue=""
                maxLength={200}
                onSave={url => {
                  const value = url.toString().trim()
                  // Reject rather than store a value agentURL() would silently
                  // ignore while the audience override still applies
                  if (value && !isSecureAgentURL(value)) {
                    dispatch.ui.set({
                      errorMessage: t('testPage.agentURLInvalid', 'Agent service URL must start with https://'),
                    })
                    return
                  }
                  setAgentPreference('agentURL', value)
                }}
                hideIcon
              />
            </List>
          </Quote>
        </ListItem>
        <ListItemSetting
          hideIcon
          label={t('testPage.backgroundWork', 'Background work')}
          subLabel={
            backgroundEnrolled === undefined
              ? t('testPage.backgroundWorkUnknown', 'Checking…')
              : backgroundEnrolled
                ? t('testPage.backgroundWorkOn', 'Enabled — while you\u2019re away the agent can look and watch, not touch. Turns you start can finish without you.')
                : t('testPage.backgroundWorkOff', 'Off — the agent only works while you\u2019re here. Enabling grants it a separate, narrower permission you can revoke any time.')
          }
          toggle={!!backgroundEnrolled}
          onClick={() => (backgroundEnrolled ? disableBackground() : connectBackground())}
        />
      </List>
      <Typography variant="subtitle1">{t('testPage.features', 'Features')}</Typography>
      <List>
        {limits.map(l => {
          if (typeof l.value === 'boolean')
            return (
              <ListItemSetting
                hideIcon
                key={l.name}
                label={t('testPage.featureLabel', {
                  name: l.name,
                  state: l.value
                    ? t('testPage.enabled', 'enabled')
                    : t('testPage.disabled', 'disabled'),
                  defaultValue: '{{name}} (default {{state}})',
                })}
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
          button={t('testPage.reset', 'Reset')}
          label={t('testPage.resetFeatureOverrides', 'Reset feature overrides')}
          onButtonClick={() => dispatch.ui.setPersistent({ limitsOverride: {} })}
        />
      </List>
      <Typography variant="subtitle1">{t('testPage.licensingOptions', 'Licensing Options')}</Typography>
      <List>
        <ListItemSetting
          hideIcon
          label={t('testPage.overrideLicensesAndLimits', 'Override licenses and limits')}
          toggle={tests.limit}
          onClick={() => dispatch.plans.set({ tests: { ...tests, limit: !tests.limit, license: !tests.license } })}
        />
        <ListItemSetting
          hideIcon
          label={t('testPage.setServiceLicenses', 'Set service licenses')}
          subLabel={t(
            'testPage.setServiceLicensesHint',
            'Will set all devices licensing in order to: UNKNOWN, EVALUATION, LICENSED, UNLICENSED, NON_COMMERCIAL, LEGACY'
          )}
          onClick={() => dispatch.plans.testServiceLicensing()}
        />
        <ListItemSetting
          hideIcon
          label={t('testPage.licenseMessageCleared', 'License message cleared')}
          toggle={informed}
          onClick={() => dispatch.plans.set({ informed: !informed })}
        />
      </List>
    </Container>
  )
}
