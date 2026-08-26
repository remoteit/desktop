import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import cloudSync from '../services/CloudSync'
import { OAUTH_AGENT_RESOURCE } from '../constants'
import { Dispatch, State } from '../store'
import { Typography, List, ListItem, Divider } from '@mui/material'
import { getApiURL, getWebSocketURL } from '../helpers/apiHelper'
import { oidcAccessToken, oidcMintError } from '../services/oidc'
import { selectLimitsLookup, selectLimits } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { bindableResources } from '../services/permitteerAccount'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemRadio } from '../components/ListItemRadio'
import { ListItemSetting } from '../components/ListItemSetting'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Quote } from '../components/Quote'
import { emit } from '../services/Controller'
import { isSecureAgentURL, backgroundConnectUrl, backgroundStatus, backgroundDisable } from '../services/agent'
import { windowOpen } from '../services/browser'

export const TestPage: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
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

  // `switchApi` is the override — the Electron backend reads it to configure the CLI binary.
  const customSelected = !!apis.switchApi
  // A hand-typed URL is only legal if the AS will mint for it; the GraphQL field reports
  // the refusal here rather than letting it surface later as ambient 403s.
  const [mintError, setMintError] = useState<string>('')

  /* `oidcAccessToken` reports a refusal by RETURNING '' so callers can degrade quietly,
     so a try/catch around it never fires — check the token itself and read the AS's
     reason ("not covered by this grant") off the oidc module. */
  async function mintCheck(...resources: string[]): Promise<boolean> {
    for (const resource of resources) {
      if (!(await oidcAccessToken(resource))) {
        setMintError(oidcMintError(resource) || resource)
        return false
      }
    }
    return true
  }

  /* The stage-pair picker (D10/D11a, permitteer docs/remoteit-desktop-login.md 4c).
     Options come FROM the AS — this client's own allowlist joined to registry names — so
     the picker and the mint-time guardrail read one source and can never disagree.
     Identifiers group into stage pairs (graphql + events); picking one sets BOTH URLs and
     mints BOTH audiences here, so an illegal target fails legibly instead of as ambient
     403s an hour later. Status is kept so a refused fetch cannot masquerade as an empty
     allowlist, which is how this sat broken unnoticed. */
  const [targets, setTargets] = useState<Array<{ identifier: string; name: string }>>([])
  const [targetsStatus, setTargetsStatus] = useState<number | undefined>(undefined)
  useEffect(() => {
    bindableResources().then(({ status, resources }) => {
      setTargets(resources)
      setTargetsStatus(status)
    })
  }, [])

  type StagePair = { stage: string; name: string; graphql?: string; ws?: string }
  const stagePairs: StagePair[] = useMemo(() => {
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

  /* Which radio is lit is DERIVED from the effective GraphQL URL, so a hand-typed URL
     that matches no stage simply lights none and there is no selection state to drift.
     The override switch stays ON throughout — it owns whether we override at all, and a
     stage only fills in the pair of URLs. */
  async function selectStage(pair: StagePair) {
    setMintError('')
    const values = {
      switchApi: true,
      apiGraphqlURL: pair.graphql!,
      ...(pair.ws ? { webSocketURL: pair.ws } : {}),
    }
    await dispatch.ui.setPersistent({ apis: { ...apis, ...values } })
    emit('preferences', { ...preferences, ...values })
    if (!(await mintCheck(pair.graphql!, ...(pair.ws ? [pair.ws] : [])))) return
    emit('binaries/install')
    cloudSync.all()
  }

  /* One switch owns the whole custom target — GraphQL, WebSocket and the agent service.
     Off returns every one of them to the stage the build ships with. switchAgent is
     browser-only, so it rides the ui state and never the backend preferences emit. */
  async function toggleCustom() {
    setMintError('')
    const on = !customSelected
    const values = on
      ? {
          switchApi: true,
          apiGraphqlURL: apis.apiGraphqlURL || getApiURL() || '',
          webSocketURL: apis.webSocketURL || getWebSocketURL() || '',
        }
      : { switchApi: false }
    await dispatch.ui.setPersistent({ apis: { ...apis, ...values, switchAgent: on } })
    emit('preferences', { ...preferences, ...values })
    emit('binaries/install')
    cloudSync.all()
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
      </List>

      <Typography variant="subtitle1">{t('testPage.apiTarget', 'API Target')}</Typography>
      <List>
        <ListItemSetting
          hideIcon
          label={t('testPage.overrideDefaultAPIs', 'Override default APIs')}
          toggle={customSelected}
          onClick={toggleCustom}
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
              {stagePairs.map(pair => (
                <ListItemRadio
                  key={pair.stage}
                  label={pair.name}
                  subLabel={pair.graphql}
                  disabled={!customSelected}
                  // Lit only when the WHOLE pair still matches — editing either URL by hand
                  // drops the light, so a half-custom target can never read as a stage.
                  checked={
                    customSelected && getApiURL() === pair.graphql && (!pair.ws || getWebSocketURL() === pair.ws)
                  }
                  onClick={() => selectStage(pair)}
                />
              ))}
              {customSelected && !stagePairs.length && (
                <ListItem>
                  <Typography variant="caption" color="textSecondary">
                    {targetsStatus === undefined
                      ? t('testPage.stagesLoading', 'Loading available targets\u2026')
                      : targetsStatus === 200
                        ? t('testPage.stagesEmpty', 'The authorization server lists no switchable targets for this client.')
                        : t('testPage.stagesError', 'Could not load available targets ({{status}}) \u2014 enter a URL below.', {
                            status: targetsStatus,
                          })}
                  </Typography>
                </ListItem>
              )}
              {!!stagePairs.length && <Divider variant="inset" />}
              <InlineTextFieldSetting
                value={getApiURL()}
                label={t('testPage.customGraphQLURL', 'GraphQL URL')}
                disabled={!customSelected}
                resetValue={getApiURL()}
                maxLength={200}
                onSave={async result => {
                  const url = result.toString()
                  setMintError('')
                  await setAPIPreference('apiGraphqlURL', url)
                  if (!(await mintCheck(url))) return
                  emit('binaries/install')
                  cloudSync.all()
                }}
                hideIcon
              />
              <InlineTextFieldSetting
                value={getWebSocketURL()}
                label={t('testPage.customWebSocketURL', 'WebSocket URL')}
                disabled={!customSelected}
                resetValue={getWebSocketURL()}
                maxLength={200}
                onSave={url => {
                  setAPIPreference('webSocketURL', url)
                  emit('binaries/install')
                }}
                hideIcon
              />
              <InlineTextFieldSetting
                // Gate the override on its switch the way getApiURL/getWebSocketURL do, so
                // toggling off shows the default that is actually in effect rather than a
                // stored override that agentURL() is already ignoring.
                value={(apis.switchAgent && apis.agentURL) || OAUTH_AGENT_RESOURCE}
                label={t('testPage.agentURL', 'Agent service URL')}
                disabled={!customSelected}
                resetValue={OAUTH_AGENT_RESOURCE}
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
