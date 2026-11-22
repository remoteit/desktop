import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeviceApps } from '../hooks/useDeviceApps'
import { adminHolds, appSettingNote } from './DeviceAppSetting'
import { DeviceSettingRow, lockedLine } from './DeviceSettingRow'

export const CONSOLE_APP = 'remoteit.console'
export const AI_COMMANDS = 'ai_commands'

// The terminal app's own setting, also on its app page: the same mutation, so either place changes it.
export const DeviceAiCommandsSetting: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const { apps, setSetting } = useDeviceApps(device.id, { offers: false, accountId: device.accountId })
  const [saving, setSaving] = useState(false)
  const app = apps?.find(a => a.id === CONSOLE_APP)
  const setting = app?.settings.find(s => s.name === AI_COMMANDS)

  if (!app || !setting) return null

  const held = adminHolds(setting)
  return (
    <DeviceSettingRow
      setting={setting}
      icon="sparkles"
      label={t('apps.aiCommandsLabel', 'AI can run commands on this device')}
      subLabel={
        held
          ? `${appSettingNote(t, setting)}. ${t('deviceAi.heldHow', 'They can change it on the device.')}`
          : lockedLine(t, setting) || t('apps.aiCommandsHelp', 'AI tools you connect run commands as the people you allow.')
      }
      quiet
      stateText
      disabled={saving || !device.permissions.includes('MANAGE') || !app.enabled || held}
      onChange={async on => {
        setSaving(true)
        await setSetting(app, AI_COMMANDS, on)
        setSaving(false)
      }}
    />
  )
}
