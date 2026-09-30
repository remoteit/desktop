import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListSubheader } from '@mui/material'
import { DeviceContext } from '../services/Context'
import {
  DAEMON_CHANNELS,
  DeviceDaemon,
  UNSUPPORTED,
  graphQLDeviceDaemon,
  graphQLSetDeviceDaemon,
  updating,
} from '../services/graphQLDaemon'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { SelectSetting } from '../components/SelectSetting'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { useInterval } from '../hooks/useInterval'

// How often an upgrade under way is looked at again: its states pass in seconds.
const WATCH_INTERVAL = 3000

/* The device agent (device-package's connectd-go daemon): what it runs, what it should, where an upgrade stands, and
   the device's own upgrade settings — a channel other than its account's, or held at what it runs. Behind the
   device-sessions flag (the route and the tab), and it says so where the API does not serve device sessions. */
export const DeviceAgentPage: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const [daemon, setDaemon] = useState<DeviceDaemon | null | 'ERROR' | typeof UNSUPPORTED>()
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (device?.id) setDaemon(await graphQLDeviceDaemon(device.id))
  }, [device?.id])

  useEffect(() => {
    setDaemon(undefined)
    load()
  }, [load])

  useInterval(load, typeof daemon === 'object' && updating(daemon) ? WATCH_INTERVAL : undefined)

  if (!device) return null

  const manage = device.permissions.includes('MANAGE')

  const save = async (set: { channel?: string; hold?: boolean }) => {
    setSaving(true)
    if ((await graphQLSetDeviceDaemon(device.id, set)) !== 'ERROR') await load()
    setSaving(false)
  }

  const stateLabel = (update: NonNullable<DeviceDaemon['update']>) => {
    const version = update.version
    switch (update.state) {
      case 'pending':
        return t('deviceAgent.pending', 'Waiting its turn to upgrade to {{version}}', { version })
      case 'started':
        return t('deviceAgent.started', 'Upgrade to {{version}} started', { version })
      case 'downloading':
        return t('deviceAgent.downloading', 'Downloading {{version}}', { version })
      case 'installing':
        return t('deviceAgent.installing', 'Installing {{version}}', { version })
      case 'installed':
        return t('deviceAgent.installed', 'Installed {{version}}', { version })
      case 'failed':
        return t('deviceAgent.failed', 'Upgrade to {{version}} failed', { version })
      case 'refused':
        return t('deviceAgent.refused', 'Refused {{version}}', { version })
      default:
        return `${update.state} ${version}`
    }
  }

  const body = () => {
    if (daemon === undefined) return <LoadingMessage />
    if (daemon === UNSUPPORTED)
      return (
        <Notice severity="info" fullWidth>
          {t(
            'deviceAgent.unsupported',
            'This API does not serve device sessions. Point Test Settings → API Target at a stage that does (local or dev).'
          )}
        </Notice>
      )
    if (daemon === 'ERROR')
      return (
        <Notice severity="error" fullWidth>
          {t('deviceAgent.error', 'Could not read the device agent.')}
        </Notice>
      )
    if (!daemon)
      return (
        <Notice severity="info" fullWidth>
          {t('deviceAgent.none', 'No device agent to show for this device.')}
        </Notice>
      )

    const failed = daemon.update && ['failed', 'refused'].includes(daemon.update.state)
    const upToDate = !daemon.update && (!daemon.target || daemon.target.version === daemon.running)

    return (
      <>
        <List>
          <ListItemSetting
            icon="microchip"
            label={daemon.running || t('deviceAgent.notReported', 'Not reported')}
            subLabel={
              daemon.running
                ? t('deviceAgent.runs', 'The version it runs')
                : t(
                    'deviceAgent.notReportedHint',
                    'A legacy agent — it upgrades by reinstalling — or a device agent that has not signed in'
                  )
            }
          />
          <ListItemSetting
            icon="bullseye-arrow"
            label={
              daemon.target
                ? daemon.target.rollback
                  ? t('deviceAgent.targetRollback', '{{version}} (a rollback)', { version: daemon.target.version })
                  : daemon.target.version
                : t('deviceAgent.noTarget', 'What it runs')
            }
            subLabel={
              daemon.target
                ? t('deviceAgent.target', 'The version it should run')
                : t('deviceAgent.noTargetHint', 'Its channel names no release')
            }
          />
          <ListItemSetting
            icon={failed ? 'exclamation-triangle' : updating(daemon) ? 'spinner-third' : 'circle-check'}
            iconColor={failed ? 'danger' : updating(daemon) ? 'primary' : 'success'}
            label={
              daemon.update
                ? stateLabel(daemon.update)
                : upToDate
                ? t('deviceAgent.upToDate', 'Up to date')
                : t('deviceAgent.noUpdate', 'No upgrade reported')
            }
            subLabel={daemon.update?.detail || undefined}
          />
        </List>
        <List>
          <ListSubheader>{t('deviceAgent.upgrades', 'Upgrades')}</ListSubheader>
          <SelectSetting
            icon="code-branch"
            label={t('deviceAgent.channel', 'Channel')}
            value={daemon.channel}
            values={DAEMON_CHANNELS.map(channel => ({ key: channel, name: channel }))}
            disabled={!manage || saving}
            onChange={channel => save({ channel })}
          />
          <ListItemSetting
            icon="building"
            label={t('deviceAgent.followAccount', "Follow the account's channel")}
            subLabel={t('deviceAgent.followAccountHint', 'Drop a channel set for this device alone')}
            button={t('deviceAgent.follow', 'Follow')}
            disabled={!manage || saving}
            onButtonClick={() => save({ channel: '' })}
          />
          <ListItemSetting
            icon="pause"
            label={t('deviceAgent.hold', 'Hold at this version')}
            subLabel={t('deviceAgent.holdHint', 'It takes no upgrades until released')}
            toggle={daemon.hold}
            disabled={!manage || saving}
            onClick={() => save({ hold: !daemon.hold })}
          />
        </List>
      </>
    )
  }

  return (
    <DeviceHeaderMenu>
      <Gutters size={null}>{body()}</Gutters>
    </DeviceHeaderMenu>
  )
}
