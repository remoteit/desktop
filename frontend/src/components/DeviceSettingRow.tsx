import React from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import type { TFunction } from 'i18next'
import {
  DeviceSettingName,
  MACHINE_WIDE,
  SettingState,
  settingLocked,
  settingOn,
} from '../services/graphQLDeviceSettings'
import { productLockNote } from '../helpers/productPolicyHelper'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { ListItemSetting } from './ListItemSetting'
import { SelectSetting } from './SelectSetting'

type Props = {
  setting: SettingState
  icon?: string
  hideIcon?: boolean // an option of the row above it (an app's setting): no icon of its own
  label: React.ReactNode
  subLabel?: React.ReactNode // what the setting does: in place of a note on who set it, or why it is fixed
  deprecated?: string | null // why it is deprecated, said before the rest: a setting on its way out
  on?: boolean // a part of the setting's value (exit_node's lan); else whether the setting is on, as its control fixes
  disabled?: boolean // the caller's: not one who manages the device, or a change under way
  quiet?: boolean // a part of a setting whose row above already says who set it, or why it is fixed
  explain?: boolean // a locked setting says who holds it and how to change it, in place of its note
  stateText?: boolean // its state in a word beside the switch
  confirm?: boolean
  disableGutters?: boolean // in a list whose rows have none, as the console's
  confirmProps?: React.ComponentProps<typeof ListItemSetting>['confirmProps']
  onChange: (on: boolean) => void
}

/* One device setting's switch (device-package docs/device-settings.md, "Portal"): its value, who set it when that was
   on the device, and the machine administrator's override — under off or on the switch is fixed there and greyed, under
   local it is set only on the device. A setting its product holds is greyed too, saying so. */
export const DeviceSettingRow: React.FC<Props> = ({
  setting,
  icon,
  hideIcon,
  label,
  subLabel,
  deprecated,
  on,
  disabled,
  quiet,
  explain,
  stateText,
  confirm,
  disableGutters,
  confirmProps,
  onChange,
}) => {
  const { t } = useTranslation()
  const checked = on ?? settingOn(setting)
  const said = (!quiet && ((explain && lockedLine(t, setting)) || settingNote(t, setting))) || subLabel
  const why = deprecatedLine(t, deprecated)

  return (
    <ListItemSetting
      icon={icon}
      hideIcon={hideIcon}
      label={label}
      subLabel={
        !why || !said ? (
          why || said
        ) : typeof said === 'string' ? (
          `${why} · ${said}`
        ) : (
          <>
            {why} · {said}
          </>
        )
      }
      toggle={checked}
      secondaryContent={stateText ? <StateWord on={checked} /> : undefined}
      secondaryContentWidth={stateText ? '110px' : undefined}
      disabled={disabled || settingLocked(setting)}
      confirm={confirm}
      disableGutters={disableGutters}
      confirmProps={confirmProps}
      onClick={() => onChange(!checked)}
    />
  )
}

/* A device setting whose value is a choice (websocket's auto, on, off): DeviceSettingRow's, as a select — who set it
   when that was on the device, and the administrator's override, which fixes a value here greyed and says which. */
export const DeviceSettingChoice: React.FC<{
  setting: SettingState
  icon?: string
  hideIcon?: boolean
  label: string
  value: string // the value standing, as the setting's control fixes it
  choices: ISelect[]
  note?: React.ReactNode // the setting's state, below who set it
  why?: string // who set it, or why it is fixed, in the caller's words (an app's setting); else a device setting's
  disabled?: boolean
  onChange: (value: string) => void
}> = ({ setting, icon, hideIcon, label, value, choices, note, why: said, disabled, onChange }) => {
  const { t } = useTranslation()
  const fixed = choices.find(choice => choice.key === setting.control)
  const why =
    said ??
    (fixed
      ? t('deviceSetting.controlFixedTo', "Set to {{value}} by the device's administrator", { value: fixed.name })
      : settingNote(t, setting))
  return (
    <SelectSetting
      icon={icon}
      hideIcon={hideIcon}
      label={label}
      value={value}
      values={choices}
      disabled={disabled || settingLocked(setting)}
      helperText={
        why || note ? (
          <>
            {why}
            {why && note && <br />}
            {note}
          </>
        ) : undefined
      }
      onChange={next => next !== value && onChange(next)}
    />
  )
}

export const StateWord: React.FC<{ on: boolean; children?: React.ReactNode }> = ({ on, children }) => {
  const { t } = useTranslation()
  return (
    <Typography component="span" variant="caption" color={on ? 'primary' : 'grayDark.main'} sx={{ marginRight: 1 }}>
      {children ?? (on ? t('deviceSetting.on', 'On') : t('deviceSetting.off', 'Off'))}
    </Typography>
  )
}

// A locked setting, said plainly with how to change it: the device's administrator, the device alone, or its product.
export function lockedLine(t: TFunction, setting?: SettingState): string | undefined {
  if (!setting || !settingLocked(setting)) return undefined
  if (setting.control === 'local') return t('deviceSetting.lockedLocal', 'Set only on the device. Change it there.')
  if (setting.locked)
    return `${productLockNote(t, setting.locked)}. ${t('deviceSetting.lockedProduct', 'Change it on the product.')}`
  return t('deviceSetting.lockedAdmin', "Locked by the device's administrator. They can change it on the device.")
}

// Who set a value the device took from its configuration file: not a person.
export const CONFIGURATION = 'configuration'

// Why a setting is as it is, where that is not the portal's doing: the administrator's override, its product holding
// it, or a change made on the device. None for a setting set here — but the exit and Protect, the machine's, say who
// set them in the portal too, and one a person signed in on the device set ends at their sign-out.
export function settingNote(t: TFunction, setting?: SettingState): string | undefined {
  if (!setting) return undefined
  switch (setting.control) {
    case 'off':
      return t('deviceSetting.controlOff', 'Turned off on the device by its administrator')
    case 'on':
      return t('deviceSetting.controlOn', 'Turned on on the device by its administrator')
    case 'local':
      return t('deviceSetting.controlLocal', 'Set only on the device')
  }
  if (setting.locked) return productLockNote(t, setting.locked)
  const machineWide = MACHINE_WIDE.includes(setting.name)
  const person = machineWide && setting.onDevice ? setting.signedIn?.email || setting.signedIn?.id : undefined
  if (person)
    return t('deviceSetting.onComputerBy', 'Set on this computer by {{name}} — ends when {{name}} signs out', {
      name: person,
    })
  if (machineWide && !setting.onDevice && setting.by)
    return t('deviceSetting.inPortalBy', 'Set in the portal by {{name}}', { name: setting.by })
  if (setting.onDevice)
    return setting.by === CONFIGURATION
      ? t('deviceSetting.onDeviceConfiguration', 'Set on the device, in its configuration')
      : setting.by
      ? t('deviceSetting.onDeviceBy', 'Set on the device by {{by}}', { by: setting.by })
      : t('deviceSetting.onDevice', 'Set on the device')
  return undefined
}

// A deprecated setting's line (presence-server docs/device-apps-design.md, "Deprecating and removing a setting"): still
// applied, on its way out, and why.
export function deprecatedLine(t: TFunction, deprecated?: string | null): string | undefined {
  if (deprecated === undefined || deprecated === null) return undefined
  return deprecated
    ? t('deviceSetting.deprecatedWhy', 'Deprecated: {{why}}', { why: deprecated })
    : t('deviceSetting.deprecated', 'Deprecated')
}

/* A policy-only setting (updates, initiators): nothing to set from either side, only the administrator's allowing it
   or not. Shown, read-only, where the administrator turned it off; nothing otherwise, or where the API has no device
   settings. */
export const DevicePolicyRow: React.FC<{ deviceId: string; name: DeviceSettingName; label: React.ReactNode }> = ({
  deviceId,
  name,
  label,
}) => {
  const { t } = useTranslation()
  const setting = useDeviceSettings(deviceId).setting(name)
  if (setting?.control !== 'off') return null
  return <ListItemSetting icon="lock" label={label} subLabel={settingNote(t, setting)} />
}
