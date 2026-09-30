import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListSubheader } from '@mui/material'
import {
  DAEMON_CHANNELS,
  DaemonSettings,
  UNSUPPORTED,
  graphQLDaemonSettings,
  graphQLSetDaemonSettings,
} from '../services/graphQLDaemon'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { ListItemSetting } from './ListItemSetting'
import { SelectSetting } from './SelectSetting'

/* An account's device-agent updates: automatic unless turned off, and the channel its devices follow. On the
   account's own settings (Profile) and an organization's (Settings). Hidden without the device-sessions flag, and
   where the API does not serve device sessions. */
export const DaemonSettingsList: React.FC<{ accountId?: string }> = ({ accountId }) => {
  const { t } = useTranslation()
  const enabled = useDeviceSessions()
  const [settings, setSettings] = useState<DaemonSettings>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let current = true
    graphQLDaemonSettings(accountId).then(result => {
      if (current && result && result !== 'ERROR' && result !== UNSUPPORTED) setSettings(result)
    })
    return () => {
      current = false
    }
  }, [enabled, accountId])

  if (!enabled || !settings) return null

  const save = async (set: Partial<DaemonSettings>) => {
    setSaving(true)
    const result = await graphQLSetDaemonSettings(accountId, set)
    if (result !== 'ERROR') setSettings(result.data?.data?.setDaemonSettings ?? { ...settings, ...set })
    setSaving(false)
  }

  return (
    <List>
      <ListSubheader>{t('daemonSettings.title', 'Device agent updates')}</ListSubheader>
      <ListItemSetting
        icon="arrows-rotate"
        label={t('daemonSettings.autoUpdate', 'Automatic updates')}
        subLabel={t('daemonSettings.autoUpdateHint', "Devices upgrade themselves to their channel's release")}
        toggle={settings.autoUpdate}
        disabled={saving}
        onClick={() => save({ autoUpdate: !settings.autoUpdate })}
      />
      <SelectSetting
        icon="code-branch"
        label={t('daemonSettings.channel', 'Channel')}
        value={settings.channel}
        values={DAEMON_CHANNELS.map(channel => ({ key: channel, name: channel }))}
        disabled={saving}
        onChange={channel => save({ channel })}
      />
    </List>
  )
}
