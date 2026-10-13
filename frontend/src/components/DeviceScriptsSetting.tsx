import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DeviceSettings } from '../hooks/useDeviceSettings'
import { DeviceSettingRow } from './DeviceSettingRow'

/* Allow scripts (device-package docs/scripting-plan.md, "The scripts setting"): whether the device's scripts service
   takes runs — anyone who may script the device can run commands on it, as their own account there, or as root where
   they have none. On by default on every kind of device. Not under the services switch: it is a management channel,
   not a service the people the device is shared with reach. One setting, the device's: set here or on the machine, and
   the machine's administrator may fix it either way, or leave it to the machine alone (scripts_control) — the row then
   says so, greyed. Only a device whose daemon serves scripts has it; absent elsewhere, and where the API's device
   settings do not have it. */
export const DeviceScriptsSetting: React.FC<{ settings: DeviceSettings; canManage: boolean }> = ({
  settings,
  canManage,
}) => {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const scripts = settings.setting('scripts')

  if (!scripts) return null

  return (
    <DeviceSettingRow
      setting={scripts}
      icon="scroll"
      label={t('deviceScripts.label', 'Allow scripts')}
      subLabel={t(
        'deviceScripts.hint',
        'Anyone who may script this device can run commands on it — as their own account on it, or as root if they have none. Off, no script runs here.'
      )}
      disabled={saving || !canManage}
      onChange={async on => {
        setSaving(true)
        await settings.set('scripts', on)
        setSaving(false)
      }}
    />
  )
}
