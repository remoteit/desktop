import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import cloudSync from '../services/CloudSync'
import {
  TEST_HEADER,
  GRAPHQL_API,
  OAUTH_AGENT_RESOURCE,
  CLOUD_TREE_RE,
  LEGACY_GRAPHQL_RE,
  LEGACY_EVENTS_RE,
  cloudTreeUrls,
  resourceForApiURL,
} from '../constants'
import { Dispatch, State } from '../store'
import { UIState } from '../models/ui'
import { Typography, List, ListItem, Divider } from '@mui/material'
import { getApiURL, getWebSocketURL } from '../helpers/apiHelper'
import { bindableResources } from '../services/permitteerAccount'
import { oidcAccessToken } from '../services/oidc'
import { isSecureAgentURL, backgroundConnectUrl, backgroundStatus, backgroundDisable } from '../services/agent'
import { windowOpen } from '../services/browser'
import { selectLimitsLookup, selectFeatures } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { useChatEnabled } from '../hooks/useChatEnabled'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { ListItemRadio } from '../components/ListItemRadio'
import { Container } from '../components/Container'
import { PortalUI } from '../components/PortalUI'
import { Title } from '../components/Title'
import { Quote } from '../components/Quote'
import { emit } from '../services/Controller'
import sleep from '../helpers/sleep'

export const TestPage: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const [testHeader, setTestHeader] = useState<string>(window.localStorage.getItem(TEST_HEADER) || '')
  const { tests, informed } = useSelector((state: State) => state.plans)
  const apis = useSelector((state: State) => state.ui.apis)
  const testUI = useSelector((state: State) => state.ui.testUI)
  const featureValues = useSelector(selectLimitsLookup)
  const features = useSelector(selectFeatures)
  const overrides = useSelector((state: State) => state.ui.limitsOverride)

  async function setAPIPreferences(values: UIState['apis']) {
    await dispatch.ui.setPersistent({ apis: { ...apis, ...values } })
    emit('preferences', values)
  }

  // --- the stage-pair switcher (D10+D11a, permitteer docs/remoteit-desktop-login.md 4c) ----
  // The options come FROM the AS: the client's own allowlist joined to registry names, so the
  // picker and the mint-time guardrail can never disagree. Identifiers group into stage pairs
  // (graphql + events); one selection sets BOTH URLs and mints BOTH audiences immediately, so
  // an illegal target fails here with a legible error, never as ambient 403s an hour later.
  const [targets, setTargets] = useState<Array<{ identifier: string; name: string }>>([])
  const [mintError, setMintError] = useState<string>('')
  const [agentError, setAgentError] = useState<string>('')

  // Background work (permitteer docs/remoteit-ai-agent.md D6): the agent's own, narrower
  // grant — enrollment is a browser ceremony at the AS; this page only reads/ends it. (The
  // one UI entry point for it: without this control backgroundConnectUrl/backgroundStatus
  // have no caller and the workflow cannot be enabled.)
  // Behind the chat's licence gate: without it the section is not shown and the agent service is
  // not asked anything. This toggle is a convenience, not the grant's only door: the background
  // grant is an OAuth grant held at the AS for the agent's own client, and Account → Connected Apps
  // (not gated on the licence) lists and revokes it — killing every token minted from it — whether
  // or not this account still has Remote.It AI, and whether or not the agent service answers.
  const chatEnabled = useChatEnabled()
  const [backgroundEnrolled, setBackgroundEnrolled] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    if (chatEnabled) backgroundStatus().then(setBackgroundEnrolled)
  }, [chatEnabled])
  async function connectBackground() {
    await windowOpen(backgroundConnectUrl(), '_blank', true)
    // The ceremony finishes in the browser — poll briefly for the verdict.
    for (let i = 0; i < 30; i++) {
      await sleep(2000)
      if (await backgroundStatus()) break
    }
    setBackgroundEnrolled(await backgroundStatus())
  }
  async function disableBackground() {
    await backgroundDisable()
    setBackgroundEnrolled(await backgroundStatus())
  }
  useEffect(() => {
    bindableResources().then(setTargets)
  }, [])

  // `resources` is what we MINT for, kept apart from the URLs we CALL because the two front shapes
  // disagree about that. A legacy stage is two hosts and two identifiers (graphql + events); a
  // unified-front stage is ONE identifier with both as paths inside it. Keyed by shape AND stage,
  // never stage alone: a client allowed both — which every dev client is, mid-migration — would
  // otherwise collide the two into one row that describes neither.
  type StagePair = { key: string; name: string; graphql?: string; ws?: string; resources: string[] }
  const stagePairs: StagePair[] = React.useMemo(() => {
    const pairs = new Map<string, StagePair>()
    const at = (key: string, name: string) => pairs.get(key) || { key, name, resources: [] }
    for (const target of targets) {
      // The UNIFIED FRONT (graphql-permitteer docs/CLOUD-EDGE.md). The identifier is not a URL to
      // call: graphql and the socket hang off it, and one audience covers both.
      const cloud = target.identifier.match(CLOUD_TREE_RE)
      if (cloud) {
        const key = `cloud:${cloud[1] || 'prod'}`
        pairs.set(key, {
          ...at(key, target.name),
          name: target.name,
          ...cloudTreeUrls(target.identifier),
          resources: [target.identifier],
        })
        continue
      }
      const gql = target.identifier.match(LEGACY_GRAPHQL_RE)
      const ws = target.identifier.match(LEGACY_EVENTS_RE)
      if (!gql && !ws) continue // passport / account-api entries are not switch targets
      const stage = (gql?.[1] ?? ws?.[1]) || 'prod'
      const key = `legacy:${stage}`
      const pair = at(key, stage)
      if (gql) {
        pair.graphql = target.identifier
        pair.name = target.name
      } else pair.ws = target.identifier
      pair.resources = [...pair.resources, target.identifier]
      pairs.set(key, pair)
    }
    return [...pairs.values()].filter(pair => pair.graphql)
  }, [targets])

  // Which radio is lit. The override flag is DERIVED from the choice — selecting the stage
  // this build ships with is the same thing the old "Override default APIs" switch expressed,
  // so the switch is gone and `switchApi` (still read by the Electron backend to configure
  // the CLI binary) is set from here. `customMode` is held locally because a hand-typed URL
  // may coincide with a registered stage, and the choice should not silently jump to it.
  // Compare on the URL the app actually CALLS, not on the audience it mints for. Those were the
  // same string until the unified front, where the build's resource (…/api) matches no row's URL
  // (…/api/graphql) — so every radio read unchecked and the picker looked broken.
  const currentGraphql = getApiURL()
  const [customMode, setCustomMode] = useState<boolean | undefined>(undefined)
  const customSelected =
    customMode ?? (!!apis.switchApi && stagePairs.length > 0 && !stagePairs.some(p => p.graphql === currentGraphql))

  async function selectCustom() {
    setMintError('')
    setCustomMode(true)
    await setAPIPreferences({
      switchApi: true,
      apiGraphqlURL: apis.apiGraphqlURL || getApiURL() || '',
      webSocketURL: apis.webSocketURL || getWebSocketURL() || '',
    })
  }

  async function selectStage(pair: StagePair) {
    setMintError('')
    setCustomMode(false)
    const isDefault = pair.graphql === GRAPHQL_API
    await setAPIPreferences({
      switchApi: !isDefault,
      apiGraphqlURL: pair.graphql!,
      ...(pair.ws ? { webSocketURL: pair.ws } : {}),
    })
    try {
      // One mint per RESOURCE, which is two on a legacy stage and one on the unified front — where
      // asking for the socket URL separately would answer invalid_target, correctly.
      if (!isDefault) for (const resource of pair.resources) await oidcAccessToken(resource)
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
            emit('preferences', { allowPrerelease: false, switchApi: false })
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
          subLabel={t(
            'testPage.clearViewedAnnouncementsHint',
            'Marks all loaded announcements unread for this account.'
          )}
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
            key={pair.key}
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
                  await setAPIPreferences({ apiGraphqlURL: url })
                  try {
                    await oidcAccessToken(resourceForApiURL(url))
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
                  setAPIPreferences({ webSocketURL: url.toString() })
                  emit('binaries/install')
                }}
                hideIcon
              />
            </List>
          </Quote>
        </ListItem>
      </List>

      {chatEnabled && (
        <>
          <Typography variant="subtitle1">{t('testPage.aiAgent', 'AI Agent')}</Typography>
          <List>
            <ListItemSetting
              hideIcon
              label={t('testPage.backgroundWork', 'AI background work')}
              subLabel={
                backgroundEnrolled === undefined
                  ? t('testPage.backgroundWorkUnknown', 'Checking…')
                  : backgroundEnrolled
                  ? t('testPage.backgroundWorkOn', 'The agent can read and watch while you are away.')
                  : t('testPage.backgroundWorkOff', 'The agent only works while you are here.')
              }
              toggle={!!backgroundEnrolled}
              onClick={() => (backgroundEnrolled ? disableBackground() : connectBackground())}
            />
            <ListItem>
              <Quote margin={null} indent="listItem" noInset>
                <List disablePadding>
                  <InlineTextFieldSetting
                    value={apis.agentURL || OAUTH_AGENT_RESOURCE}
                    label={t('testPage.agentURL', 'Agent service URL (advanced)')}
                    resetValue={OAUTH_AGENT_RESOURCE}
                    maxLength={200}
                    onSave={result => {
                      const url = result.toString().trim()
                      if (url && !isSecureAgentURL(url)) {
                        setAgentError(t('testPage.agentURLInvalid', 'Agent service URL must start with https://'))
                        return
                      }
                      setAgentError('')
                      // Reset (or entering the default) CLEARS the override so agentURL() falls back to the
                      // /agent proxy (dev) or VITE_AGENT_URL (build) — never pinning the OAuth audience as the transport.
                      setAPIPreferences({ agentURL: url === OAUTH_AGENT_RESOURCE ? '' : url })
                    }}
                    hideIcon
                  />
                  {!!agentError && (
                    <ListItem>
                      <Typography variant="caption" color="error">
                        {agentError}
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </Quote>
            </ListItem>
          </List>
        </>
      )}
      <Typography variant="subtitle1">{t('testPage.features', 'Features')}</Typography>
      <List>
        {features.map(f => (
          <ListItemSetting
            hideIcon
            key={f.name}
            label={t('testPage.featureLabel', {
              name: f.name,
              state: f.value ? t('testPage.enabled', 'enabled') : t('testPage.disabled', 'disabled'),
              defaultValue: '{{name}} (default {{state}})',
            })}
            toggle={!!featureValues[f.name]}
            /* Writes the OVERRIDE, not the effective lookup. Spreading the lookup pinned
               every OTHER feature at its current value as well, so a later change to the
               account's license went unseen until someone hit Reset. */
            onClick={() =>
              dispatch.ui.setPersistent({ limitsOverride: { ...overrides, [f.name]: !featureValues[f.name] } })
            }
          />
        ))}
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
