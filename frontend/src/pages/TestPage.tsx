import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import cloudSync from '../services/CloudSync'
import { TEST_HEADER, GRAPHQL_API } from '../constants'
import { Dispatch, State } from '../store'
import { Typography, List, ListItem, Divider } from '@mui/material'
import { getApiURL, getWebSocketURL, resourceForApiURL } from '../helpers/apiHelper'
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
      const cloud = target.identifier.match(/^https:\/\/cloud(?:\.([a-z0-9-]+))?\.remote\.it\/api$/)
      if (cloud) {
        const key = `cloud:${cloud[1] || 'prod'}`
        pairs.set(key, {
          ...at(key, target.name),
          name: target.name,
          graphql: `${target.identifier}/graphql`,
          ws: `${target.identifier.replace(/^https:/, 'wss:')}/ws`,
          resources: [target.identifier],
        })
        continue
      }
      const gql = target.identifier.match(/^https:\/\/graphql(?:\.([a-z0-9-]+))?\.remote\.it\/graphql$/)
      const ws = target.identifier.match(/^wss:\/\/ws(?:\.([a-z0-9-]+))?\.remote\.it\/v1$/)
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
    const isDefault = pair.graphql === GRAPHQL_API
    const values = {
      switchApi: !isDefault,
      apiGraphqlURL: pair.graphql!,
      ...(pair.ws ? { webSocketURL: pair.ws } : {}),
    }
    await dispatch.ui.setPersistent({ apis: { ...apis, ...values } })
    emit('preferences', { ...preferences, ...values })
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
                  await setAPIPreference('apiGraphqlURL', url)
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
                  setAPIPreference('webSocketURL', url)
                  emit('binaries/install')
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
