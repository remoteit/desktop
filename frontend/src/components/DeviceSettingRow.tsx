import React from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { DeviceSetting, DeviceSettingName, settingLocked, settingOn } from '../services/graphQLDeviceSettings'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { ListItemSetting } from './ListItemSetting'
import { SelectSetting } from './SelectSetting'

type Props = {
  setting: DeviceSetting
  icon?: string
  label: React.ReactNode
  subLabel?: React.ReactNode // what the setting does: in place of a note on who set it, or why it is fixed
  on?: boolean // a part of the setting's value (exit_node's lan); else whether the setting is on, as its control fixes
  disabled?: boolean // the caller's: not one who manages the device, or a change under way
  quiet?: boolean // a part of a setting whose row above already says who set it, or why it is fixed
  confirm?: boolean
  disableGutters?: boolean // in a list whose rows have none, as the console's
  confirmProps?: React.ComponentProps<typeof ListItemSetting>['confirmProps']
  onChange: (on: boolean) => void
}

/* One device setting's switch (device-package docs/device-settings.md, "Portal"): its value, who set it when that was
   on the device, and the machine administrator's override — under off or on the switch is fixed there and greyed, under
   local it is set only on the device. */
export const DeviceSettingRow: React.FC<Props> = ({
  setting,
  icon,
  label,
  subLabel,
  on,
  disabled,
  quiet,
  confirm,
  disableGutters,
  confirmProps,
  onChange,
}) => {
  const { t } = useTranslation()
  const checked = on ?? settingOn(setting)

  return (
    <ListItemSetting
      icon={icon}
      label={label}
      subLabel={(!quiet && settingNote(t, setting)) || subLabel}
      toggle={checked}
      disabled={disabled || settingLocked(setting)}
      confirm={confirm}
      disableGutters={disableGutters}
      confirmProps={confirmProps}
      onClick={() => onChange(!checked)}
    />
  )
}

/* A device setting whose value is a choice (websocket's auto, on, off): DeviceSettingRow's, as a select — who set it
   when that was on the device, and the administrator's override, which fixes a value here greyed. */
export const DeviceSettingChoice: React.FC<{
  setting: DeviceSetting
  icon?: string
  label: string
  value: string // the value standing, as the setting's control fixes it
  choices: ISelect[]
  note?: React.ReactNode // the setting's state, below who set it
  disabled?: boolean
  onChange: (value: string) => void
}> = ({ setting, icon, label, value, choices, note, disabled, onChange }) => {
  const { t } = useTranslation()
  const why = settingNote(t, setting)
  return (
    <SelectSetting
      icon={icon}
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

// Who set a value the device took from its configuration file: not a person.
export const CONFIGURATION = 'configuration'

// Why a setting is as it is, where that is not the portal's doing: the administrator's override, or a change made on the
// device. None for a setting set here.
export function settingNote(t: TFunction, setting?: DeviceSetting): string | undefined {
  if (!setting) return undefined
  switch (setting.control) {
    case 'off':
      return t('deviceSetting.controlOff', 'Turned off on the device by its administrator')
    case 'on':
      return t('deviceSetting.controlOn', 'Turned on on the device by its administrator')
    case 'auto':
      return t('deviceSetting.controlFixed', 'Fixed on the device by its administrator')
    case 'local':
      return t('deviceSetting.controlLocal', 'Set only on the device')
  }
  if (setting.onDevice)
    return setting.by === CONFIGURATION
      ? t('deviceSetting.onDeviceConfiguration', 'Set on the device, in its configuration')
      : setting.by
      ? t('deviceSetting.onDeviceBy', 'Set on the device by {{by}}', { by: setting.by })
      : t('deviceSetting.onDevice', 'Set on the device')
  return undefined
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
