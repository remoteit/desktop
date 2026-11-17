import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, Button, List, ListItem, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material'
import {
  ProductApp,
  ProductAppState,
  ProductAppSetting,
  ProductRemovedSetting,
  ProductRootConsent,
  ProductSync,
  graphQLSetDeviceProductApp,
  graphQLSetDeviceProductAppSetting,
} from '../services/productPolicy'
import { RootConsent } from './AppRootConsent'
import { deprecatedLine } from './DeviceSettingRow'
import { SelectSetting } from './SelectSetting'
import { timeOptions } from './Timestamp'
import { Notice } from './Notice'
import { Icon } from './Icon'
import { appIcon, asksConsent, capabilitiesLine, consentCovers, productRelease } from '../helpers/appsHelper'
import { graphQLCatalogApp } from '../services/graphQLAppCatalog'
import { LIST_ITEM_ICON_WIDTH, spacing } from '../styling'

type Props = {
  productId: string
  accountId: string | undefined // the account the product was read under, whose catalogue names its releases
  apps: ProductApp[]
  sync: ProductSync
  manage: boolean
  onChanged: () => void // read the product again
}

// A select's key for unset: each device's own.
const UNSET = ''

/* The apps a product sets on its devices (presence-server docs/device-apps-design.md, "Product policy" under
   "Lifecycle: add, disable, remove", and "The Apps pages"): every catalogue app its account may take, a row each — its
   publisher, its version and channel or pin, Runs as root where it does and what else it asks of remote.it (its
   capabilities, where the API says them) — with a select: Unset (each device's own),
   Enabled (added and enabled), Disabled (added, nothing installed) or Removed (taken off its devices, and kept off);
   under enforced, Unset reads "Removed (not listed)", as an app the product does not list is removed. Its settings are
   its options, inside its row and lined up under its name. One the product sets is locked on its devices while it is
   synced or enforced; a setting the release says may not be forced is given to them but not locked, and is said so.

   An app whose release asks for a consent (helpers/appsHelper asksConsent: it runs as root, or declares capabilities)
   is enabled for the product only once the person says yes — to its full control of every device in the product, now
   and later, where it runs as root, and to what it asks of remote.it (components/AppRootConsent); graphql keeps that
   consent on the product, and asks for it again when a new release newly asks for more (needsConsent), its devices
   staying on the release before meanwhile (or not turned on, where there is none). graphql says whether the consent
   kept covers its release only while the app is enabled (needsConsent): turning one on, the release the product names
   (productRelease) is read from the catalogue, under the product's account, and weighed as graphql weighs it
   (consentCovers) — asked where the catalogue cannot say. Turning an app on needs Scripting in the product's account
   as well as managing the product; graphql says so where it refuses, and its words are shown.

   A setting a release deprecates is shown, with why, only where the product sets a value; one a later release removed
   is listed as Removed in <version>, with no effect on its devices, until graphql's daily sweep deletes it — or the
   product clears it here. */
export const ProductPolicyApps: React.FC<Props> = ({ productId, accountId, apps, sync, manage, onChanged }) => {
  const { t } = useTranslation()
  const [saving, setSaving] = useState<string>()
  const [refusal, setRefusal] = useState<string>()
  const [asking, setAsking] = useState<{ app: ProductApp; release: string | null }>()

  if (!apps.length) return null

  // A refusal in graphql's words; otherwise what was not changed.
  const write = async (key: string, failed: string, call: () => ReturnType<typeof graphQLSetDeviceProductApp>) => {
    setSaving(key)
    setRefusal(undefined)
    const result = await call()
    setSaving(undefined)
    if (result !== true) setRefusal(result !== 'ERROR' && result.reason ? result.reason : failed)
    onChanged()
  }

  // Enabling an app whose release asks for a consent the product's does not cover asks for it first — one whose devices
  // stay on the release before while a new one waits (needsConsent) included.
  const setApp = async (app: ProductApp, state: ProductAppState | null, consentRoot?: boolean) => {
    if (state === 'enabled' && !consentRoot) {
      if (app.needsConsent) return setAsking({ app, release: app.awaitingRoot ?? null })
      if (asksConsent(app)) {
        const asks = await namedAsks(app)
        if (asks !== false) return setAsking({ app, release: asks })
      }
    }
    write(app.id, t('productApps.notChanged', 'The app was not changed.'), () =>
      graphQLSetDeviceProductApp(
        productId,
        app.id,
        state,
        state && state !== 'removed'
          ? { channel: app.channel, version: app.pinned, ...(consentRoot && { consentRoot }) }
          : {}
      )
    )
  }

  // The release enabling names, where it asks for a consent the product's does not cover (none where the catalogue
  // cannot say which); false where it asks for none, or is covered.
  const namedAsks = async (app: ProductApp): Promise<string | null | false> => {
    setSaving(app.id)
    const answer = await graphQLCatalogApp(app.id, { accountId, releases: 100 })
    setSaving(undefined)
    const catalog = typeof answer === 'object' && answer ? answer : undefined
    const named = catalog && productRelease(catalog, app.channel, app.pinned)
    if (!catalog || !named) return null
    if (!asksConsent(named) || consentCovers(app.rootConsent, named, catalog.releases)) return false
    return named.version
  }

  const setSetting = (app: ProductApp, name: string, value: any) =>
    write(`${app.id}.${name}`, t('productSettings.notChanged', 'The setting was not changed.'), () =>
      graphQLSetDeviceProductAppSetting(productId, app.id, name, value)
    )

  const unsetName =
    sync === 'enforced'
      ? t('productApps.unsetRemoved', 'Removed (not listed)')
      : t('productApps.unset', 'Unset: each device’s own')

  return (
    <Box marginTop={3} data-product-apps>
      <Typography variant="subtitle2" color="textSecondary">
        {t('productApps.title', 'Apps')}
      </Typography>
      <Typography variant="caption" color="textSecondary" component="p">
        {sync === 'enforced'
          ? t(
              'productApps.hintEnforcedStates',
              'An app set here is locked on its devices. One not listed is removed from them, as the product is enforced.'
            )
          : t(
              'productApps.hintStates',
              'Enabled adds and runs it on the product’s devices, Disabled adds it stopped, Removed takes it off them. One left unset is each device’s own. One set here is locked on its devices while the product is synced or enforced.'
            )}
      </Typography>
      <List dense disablePadding>
        {apps.map(app => {
          const settings = app.settings.filter(setting => !setting.deprecated || setting.value !== null)
          const value = app.state ?? UNSET
          return (
            <Box component="li" key={app.id} data-product-app={app.id} sx={{ listStyle: 'none' }}>
              <ListItem component="div" disableGutters sx={{ alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ marginTop: 0.5 }}>
                  <Icon name={appIcon(app.protocol)} size="md" fixedWidth />
                </ListItemIcon>
                <ListItemText
                  primary={app.name}
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <>
                      <Line data="about">{about(t, app)}</Line>
                      {app.description && <Line data="description">{app.description}</Line>}
                      {app.root && (
                        <Line data="root" color="warning.main">
                          {t('deviceApps.runsAsRoot', 'Runs as root: full control of this device')}
                        </Line>
                      )}
                      {!!app.capabilities.length && (
                        <Line data="capabilities">{capabilitiesLine(t, app.capabilities)}</Line>
                      )}
                      {app.locked && <Line data="locked">{lockedLine(t, sync)}</Line>}
                      {app.rootConsent && !app.needsConsent && (
                        <Line data="consent">{consentedLine(t, app.root, app.rootConsent)}</Line>
                      )}
                      {app.needsConsent && (
                        <Line data="needs-consent" color="warning.main">
                          {app.awaitingRoot && app.version
                            ? t(
                                'productApps.needsConsentAsksStay',
                                'A new version ({{version}}) needs your consent: its devices stay on {{current}} until you consent',
                                { version: app.awaitingRoot, current: app.version }
                              )
                            : t(
                                'productApps.needsConsentAsks',
                                'A new version needs your consent: its devices are not turned on until you consent'
                              )}
                        </Line>
                      )}
                    </>
                  }
                />
                {app.needsConsent && manage && (
                  <Button
                    size="small"
                    color="warning"
                    disabled={saving === app.id}
                    onClick={() => setAsking({ app, release: app.awaitingRoot ?? null })}
                    data-product-app-consent-action
                  >
                    {t('productApps.consent', 'Consent…')}
                  </Button>
                )}
              </ListItem>
              <List
                dense
                disablePadding
                data-product-app-options={app.id}
                // Under the app's name: past its icon, less the gap a setting's row keeps for the icon it has not.
                sx={{ paddingLeft: `${LIST_ITEM_ICON_WIDTH - spacing.sm}px` }}
              >
                <SelectSetting
                  data-product-app-state={app.id}
                  label={t('productApps.onDevices', 'On its devices')}
                  value={value}
                  values={[
                    { key: UNSET, name: unsetName },
                    { key: 'enabled', name: t('productApps.stateEnabled', 'Enabled') },
                    { key: 'disabled', name: t('productApps.stateDisabled', 'Disabled') },
                    { key: 'removed', name: t('productApps.stateRemoved', 'Removed') },
                  ]}
                  disabled={!manage || saving === app.id}
                  disableGutters
                  hideIcon
                  onChange={key => key !== value && setApp(app, key === UNSET ? null : (key as ProductAppState))}
                />
                {(app.removedSettings ?? []).map(removed => (
                  <ProductRemovedSettingRow
                    key={removed.name}
                    removed={removed}
                    disabled={!manage || saving === `${app.id}.${removed.name}`}
                    onClear={() => setSetting(app, removed.name, null)}
                  />
                ))}
                {settings.map(setting => (
                  <ProductAppSettingRow
                    key={setting.name}
                    setting={setting}
                    sync={sync}
                    label={setting.label}
                    help={setting.help}
                    disabled={!manage || saving === `${app.id}.${setting.name}`}
                    onChange={next => setSetting(app, setting.name, next)}
                  />
                ))}
              </List>
            </Box>
          )
        })}
      </List>
      {refusal && (
        <Notice severity="error" fullWidth onClose={() => setRefusal(undefined)}>
          {refusal}
        </Notice>
      )}
      <RootConsent
        product
        app={asking?.app}
        version={asking?.app.state === 'enabled' && asking.app.needsConsent ? asking.app.awaitingRoot : undefined}
        release={asking?.release || asking?.app.version}
        accountId={accountId}
        action={
          asking?.app.state === 'enabled'
            ? root =>
                root
                  ? t('productApps.consentAction', 'Consent to full control')
                  : t('productApps.consentAsksAction', 'Consent')
            : undefined
        }
        onConfirm={() => {
          const app = asking?.app
          setAsking(undefined)
          if (app) setApp(app, 'enabled', true)
        }}
        onDeny={() => setAsking(undefined)}
      />
    </Box>
  )
}

const Line: React.FC<{ data: string; color?: string; children: React.ReactNode }> = ({ data, color, children }) => (
  <Typography
    variant="caption"
    component="div"
    color={color ?? 'textSecondary'}
    {...{ [`data-product-app-${data}`]: true }}
  >
    {children}
  </Typography>
)

/* A value the product sets of a setting its devices' release no longer declares: no effect on them. Cleared here, or by
   graphql's daily sweep once no device runs a release that declares it. */
const ProductRemovedSettingRow: React.FC<{
  removed: ProductRemovedSetting
  disabled?: boolean
  onClear: () => void
}> = ({ removed, disabled, onClear }) => {
  const { t } = useTranslation()
  return (
    <ListItem
      disableGutters
      dense
      sx={{ paddingLeft: `${spacing.sm}px` }}
      data-product-app-removed={removed.name}
      secondaryAction={
        <Button size="small" disabled={disabled} onClick={onClear} data-product-app-removed-clear={removed.name}>
          {t('productApps.clearRemoved', 'Clear')}
        </Button>
      }
    >
      <ListItemText
        primary={`${removed.name}: ${JSON.stringify(removed.value)}`}
        secondary={
          removed.removedIn
            ? t('productApps.removedIn', 'Removed in {{version}}: no effect on devices that run it', {
                version: removed.removedIn,
              })
            : t('productApps.removed', 'Removed: no effect on its devices')
        }
        primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
        secondaryTypographyProps={{ variant: 'caption' }}
      />
    </ListItem>
  )
}

/* One of an app's settings as the product sets it: unset (each device's own), or a value — a bool on or off, one of a
   choice's, an int, a string or a list (one item a line) typed and set when the field is left, cleared to unset. */
const ProductAppSettingRow: React.FC<{
  setting: ProductAppSetting
  sync: ProductSync
  label: string
  help?: string | null
  disabled?: boolean
  onChange: (value: any) => void
}> = ({ setting, sync, label, help, disabled, onChange }) => {
  const { t } = useTranslation()
  const note = [deprecatedLine(t, setting.deprecated), help, settingLockLine(t, setting, sync)]
    .filter(Boolean)
    .join(' · ')
  const unset = { key: UNSET, name: t('productSettings.unset', 'Each device’s own') }

  if (setting.type === 'bool' || setting.type === 'choice') {
    const choices =
      setting.type === 'bool'
        ? [
            { key: 'on', name: t('productSettings.on', 'On'), value: true },
            { key: 'off', name: t('productSettings.off', 'Off'), value: false },
          ]
        : (setting.choices ?? []).map(choice => ({ key: choice.value, name: choice.label, value: choice.value }))
    const value = choices.find(choice => choice.value === setting.value)?.key ?? UNSET
    return (
      <SelectSetting
        data-product-app-setting={setting.name}
        label={label}
        value={value}
        values={[unset, ...choices]}
        helperText={note || undefined}
        disabled={disabled}
        disableGutters
        hideIcon
        onChange={key => key !== value && onChange(key === UNSET ? null : choices.find(c => c.key === key)?.value)}
      />
    )
  }
  return <ProductAppSettingField setting={setting} label={label} note={note} disabled={disabled} onChange={onChange} />
}

const ProductAppSettingField: React.FC<{
  setting: ProductAppSetting
  label: string
  note: string
  disabled?: boolean
  onChange: (value: any) => void
}> = ({ setting, label, note, disabled, onChange }) => {
  const { t } = useTranslation()
  const list = setting.type === 'list'
  const known = ['int', 'string', 'list'].includes(setting.type)
  const shown = (value: any) =>
    value === null || value === undefined ? '' : list ? (Array.isArray(value) ? value.join('\n') : '') : String(value)
  const [text, setText] = useState(shown(setting.value))
  useEffect(() => setText(shown(setting.value)), [setting.value])

  const commit = () => {
    if (text === shown(setting.value)) return
    if (text.trim() === '') return onChange(null)
    if (setting.type === 'int') {
      const number = Number(text)
      if (!Number.isInteger(number)) return setText(shown(setting.value))
      return onChange(number)
    }
    onChange(
      list
        ? text
            .split('\n')
            .map(item => item.trim())
            .filter(Boolean)
        : text
    )
  }

  return (
    <ListItem disableGutters dense sx={{ paddingLeft: `${spacing.sm}px` }} data-product-app-setting={setting.name}>
      <TextField
        fullWidth
        variant="standard"
        label={label}
        value={text}
        multiline={list}
        type={setting.type === 'int' ? 'number' : 'text'}
        placeholder={t('productSettings.unset', 'Each device’s own')}
        InputLabelProps={{ shrink: true }}
        helperText={note || undefined}
        disabled={disabled || !known}
        onChange={event => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter' && !list) commit()
        }}
      />
    </ListItem>
  )
}

// Who publishes it, and the release this stage gives its devices: on its channel, or pinned.
function about(t: TFunction, app: ProductApp) {
  const channel = app.pinned
    ? t('productApps.pinned', 'Pinned')
    : app.channel === 'beta'
    ? t('deviceApps.beta', 'Beta')
    : app.channel === 'stable'
    ? t('deviceApps.stable', 'Stable')
    : app.channel
  return [
    t('deviceApps.publisher', 'By {{publisher}}', { publisher: app.publisher }),
    app.version ?? t('productApps.noRelease', 'No release here yet'),
    channel,
  ]
    .filter(Boolean)
    .join(' · ')
}

// Who consented for the product, and when: to its running as root where it does, else to what it asks.
function consentedLine(t: TFunction, root: boolean, consent: ProductRootConsent): string {
  const words = { by: consent.email || consent.by, when: when(consent.at) }
  return root
    ? t(
        'productApps.consentedAll',
        'Consented to run as root by {{by}}, {{when}}: for every device in this product, now and later',
        words
      )
    : t(
        'productApps.consentedAllAsks',
        'Consented by {{by}}, {{when}}: for every device in this product, now and later',
        words
      )
}

const lockedLine = (t: TFunction, sync: ProductSync) =>
  sync === 'enforced'
    ? t('productApps.lockedEnforced', 'Locked on its devices (enforced)')
    : t('productApps.lockedSynced', 'Locked on its devices (synced)')

// Whether a setting the product sets is held on its devices: locked, or given but not locked, as its release does not
// let it be forced on (a bool) or fixed (any other). Nothing is locked under template, so nothing is said there.
function settingLockLine(t: TFunction, setting: ProductAppSetting, sync: ProductSync): string | undefined {
  if (setting.locked) return lockedLine(t, sync)
  if (setting.value === null || sync === 'template') return undefined
  return setting.type === 'bool'
    ? t('productApps.notLockedBool', 'Given to its devices, not locked: this setting can’t be forced on')
    : t('productApps.notLocked', 'Given to its devices, not locked: this setting can’t be fixed')
}

// A consent's time as the person reads it, as Timestamp says a time.
function when(at: string) {
  const date = new Date(at)
  return isNaN(date.getTime()) ? at : date.toLocaleDateString(navigator.language, timeOptions.minutes)
}
