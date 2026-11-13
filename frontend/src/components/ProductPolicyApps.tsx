import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, Button, List, ListItem, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material'
import {
  ProductApp,
  ProductAppSetting,
  ProductRemovedSetting,
  ProductSync,
  graphQLSetDeviceProductApp,
  graphQLSetDeviceProductAppSetting,
} from '../services/productPolicy'
import { firstPartyApp } from './firstPartyApps'
import { RootConsent } from './AppRootConsent'
import { deprecatedLine } from './DeviceSettingRow'
import { SelectSetting } from './SelectSetting'
import { timeOptions } from './Timestamp'
import { Notice } from './Notice'
import { Icon } from './Icon'
import { LIST_ITEM_ICON_WIDTH, spacing } from '../styling'

type Props = {
  productId: string
  apps: ProductApp[]
  sync: ProductSync
  manage: boolean
  onChanged: () => void // read the product again
}

// A select's key for unset: each device's own.
const UNSET = ''

/* The apps a product sets on its devices (presence-server docs/device-apps-design.md, "Product policy"): every
   catalogue app its account may take, a row each as on a device's Apps section — its publisher, its version and
   channel, Runs as root where it does — with its settings as its options, inside its row and lined up under its name.
   Each is on, off or left to each device; under enforced, one left unset is off on its devices. One the product sets
   is locked on its devices while it is synced or enforced; a setting the release says may not be forced is given to
   them but not locked, and is said so.

   A root app is turned on for the product only once the person says yes to its full control of every device in the
   product, now and later (components/AppRootConsent); graphql keeps that consent on the product, and asks for it again
   when a new release newly runs as root, its devices staying on its last restricted release meanwhile (or not turned
   on, where there is none). Turning an app on needs Scripting in the product's account as well as managing the
   product; graphql says so where it refuses, and its words are shown.

   A setting a release deprecates is shown, with why, only where the product sets a value; one a later release removed
   is listed as Removed in <version>, with no effect on its devices, until graphql's daily sweep deletes it — or the
   product clears it here. */
export const ProductPolicyApps: React.FC<Props> = ({ productId, apps, sync, manage, onChanged }) => {
  const { t } = useTranslation()
  const [saving, setSaving] = useState<string>()
  const [refusal, setRefusal] = useState<string>()
  const [asking, setAsking] = useState<ProductApp>()

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

  // Turning a root app on without a consent that covers its release asks for one first.
  const setApp = (app: ProductApp, on: boolean | null, consentRoot?: boolean) => {
    if (on === true && !consentRoot && app.root && (!app.rootConsent || app.needsConsent)) return setAsking(app)
    write(app.id, t('productApps.notChanged', 'The app was not changed.'), () =>
      graphQLSetDeviceProductApp(
        productId,
        app.id,
        on,
        on ? { channel: app.channel, version: app.pinned, ...(consentRoot && { consentRoot }) } : {}
      )
    )
  }

  const setSetting = (app: ProductApp, name: string, value: any) =>
    write(`${app.id}.${name}`, t('productSettings.notChanged', 'The setting was not changed.'), () =>
      graphQLSetDeviceProductAppSetting(productId, app.id, name, value)
    )

  const unsetName =
    sync === 'enforced'
      ? t('productApps.unsetEnforced', 'Not set: off on its devices')
      : t('productSettings.unset', 'Each device’s own')

  return (
    <Box marginTop={3} data-product-apps>
      <Typography variant="subtitle2" color="textSecondary">
        {t('productApps.title', 'Apps')}
      </Typography>
      <Typography variant="caption" color="textSecondary" component="p">
        {sync === 'enforced'
          ? t(
              'productApps.hintEnforced',
              'An app set here is locked on its devices. One not set is turned off on them, as the product is enforced.'
            )
          : t(
              'productApps.hint',
              'An app left to each device is the device’s to turn on or off. One set here is locked on its devices while the product is synced or enforced.'
            )}
      </Typography>
      <List dense disablePadding>
        {apps.map(app => {
          const own = firstPartyApp(app.id)
          const words = own?.settings?.(t) ?? {}
          const settings = app.settings.filter(setting => !setting.deprecated || setting.value !== null)
          const value = app.on === null ? UNSET : app.on ? 'on' : 'off'
          return (
            <Box component="li" key={app.id} data-product-app={app.id} sx={{ listStyle: 'none' }}>
              <ListItem component="div" disableGutters sx={{ alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ marginTop: 0.5 }}>
                  <Icon name={own?.icon ?? 'cube'} size="md" fixedWidth />
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
                      {app.locked && <Line data="locked">{lockedLine(t, sync)}</Line>}
                      {app.rootConsent && !app.needsConsent && (
                        <Line data="consent">
                          {t(
                            'productApps.consentedAll',
                            'Consented to run as root by {{by}}, {{when}}: for every device in this product, now and later',
                            {
                              by: app.rootConsent.email || app.rootConsent.by,
                              when: when(app.rootConsent.at),
                            }
                          )}
                        </Line>
                      )}
                      {app.needsConsent && (
                        <Line data="needs-consent" color="warning.main">
                          {app.awaitingRoot && app.version
                            ? t(
                                'productApps.needsConsentStay',
                                'A new version ({{version}}) needs to run as root: its devices stay on {{current}} until you consent',
                                { version: app.awaitingRoot, current: app.version }
                              )
                            : t(
                                'productApps.needsConsent',
                                'A new version needs to run as root: its devices are not turned on until you consent'
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
                    onClick={() => setAsking(app)}
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
                  data-product-app-on={app.id}
                  label={t('productApps.onDevices', 'On its devices')}
                  value={value}
                  values={[
                    { key: UNSET, name: unsetName },
                    { key: 'on', name: t('productSettings.on', 'On') },
                    { key: 'off', name: t('productSettings.off', 'Off') },
                  ]}
                  disabled={!manage || saving === app.id}
                  disableGutters
                  hideIcon
                  onChange={key => key !== value && setApp(app, key === UNSET ? null : key === 'on')}
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
                    label={words[setting.name]?.label ?? setting.label}
                    help={words[setting.name]?.help ?? setting.help}
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
        app={asking}
        version={asking?.on && asking.needsConsent ? asking.awaitingRoot : undefined}
        action={asking?.on ? t('productApps.consentAction', 'Consent to full control') : undefined}
        onConfirm={() => {
          const app = asking
          setAsking(undefined)
          if (app) setApp(app, true, true)
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
