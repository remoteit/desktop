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
  daemonVersion,
  belowMinimum,
  held,
  managedElsewhere,
  runningVersion,
  updating,
} from '../services/graphQLDaemon'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { DevicePolicyRow } from '../components/DeviceSettingRow'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { SelectSetting } from '../components/SelectSetting'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { BROWSER_PLATFORM } from '../services/browserClients'
import { belowMinimumText, upkeepText, withAvailable } from '../services/upkeepText'
import { useInterval } from '../hooks/useInterval'

// How often an upgrade under way is looked at again: its states pass in seconds.
const WATCH_INTERVAL = 3000

/* The device agent (device-package's connectd-go daemon): what it runs, what it should, where an upgrade stands, and
   the device's own upgrade settings — a channel other than its account's, or held at what it runs. Behind the
   device-sessions flag (the route and the tab), and it says so where the API does not serve device sessions. Where the
   machine's administrator allows no remote upgrades (the updates policy), that is said with them. */
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

  const save = async (set: { channel?: string; hold?: boolean; rollback?: boolean }) => {
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
      case 'held':
        return held({ update })
          ? t('deviceAgent.held', "Blocked — held by the device's admin")
          : t('deviceAgent.notTaken', 'Not taken here: {{version}}', { version })
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
            'This API does not serve Control Link devices. Point Test Settings → API Target at a stage that does (local or dev).'
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

    // Upgraded by something other than our rollouts — its container image, Home Assistant, its store, the portal that
    // loads it, its admin who turned updates off: said who, and how to update it, in a neutral voice — never a failure.
    const elsewhere = managedElsewhere(daemon)
    // Held by the device's admin (a package hold or lock): blocked, not failed — it upgrades once the hold is lifted.
    const blocked = held(daemon)
    const failed = !blocked && daemon.update && ['failed', 'refused'].includes(daemon.update.state)
    const running = runningVersion(daemon)
    // A daemon with no package — the browser's client, a phone's app — is updated by what carries it: no release is
    // its (connectd takes none), so nothing here upgrades it.
    const packageless = !!running && !daemon.package?.version && daemon.distribution === 'none'
    const browser = device.targetPlatform === BROWSER_PLATFORM
    const upToDate = !daemon.update && (!daemon.target || daemon.target.version === running)

    // Below the oldest build its kind may run: what the cloud no longer speaks may fail for it — said first, whoever
    // updates it.
    const tooOld = belowMinimum(daemon) && belowMinimumText(t, daemon.supported!, elsewhere, daemon.package?.format)

    return (
      <>
        {tooOld && (
          <Notice severity="warning" fullWidth>
            {tooOld.label}
            <em>{tooOld.hint}</em>
          </Notice>
        )}
        <List>
          <ListItemSetting
            icon="microchip"
            label={running || t('deviceAgent.notReported', 'Not reported')}
            subLabel={
              running
                ? daemon.package?.version
                  ? t('deviceAgent.runsPackage', 'The version it runs — connectd {{connectd}}', {
                      connectd: daemonVersion(daemon),
                    })
                  : t('deviceAgent.runs', 'The version it runs')
                : t(
                    'deviceAgent.notReportedHint',
                    'A legacy agent — it upgrades by reinstalling — or a device agent that has not signed in'
                  )
            }
          />
          {elsewhere ? (
            (() => {
              const upkeep = upkeepText(t, elsewhere, daemon.package?.format)
              return (
                <ListItemSetting
                  icon={upkeep.icon}
                  iconColor="grayDark"
                  label={withAvailable(t, upkeep.label, daemon.available)}
                  subLabel={upkeep.hint}
                />
              )
            })()
          ) : packageless ? (
            <ListItemSetting
              icon={browser ? 'browser' : 'mobile'}
              label={
                browser
                  ? t('deviceAgent.withPortal', 'Updates with the portal')
                  : t('deviceAgent.withApp', 'Updated by the app that carries it')
              }
              subLabel={
                browser
                  ? t(
                      'deviceAgent.withPortalHint',
                      "This browser's remote.it client loads from the portal: each new client is published there, and nothing here upgrades it"
                    )
                  : t('deviceAgent.withAppHint', 'It has no package of its own: nothing here upgrades it')
              }
            />
          ) : (
            <>
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
            {blocked ? (
              <ListItemSetting
                icon="lock"
                iconColor="warning"
                label={t('deviceAgent.held', "Blocked — held by the device's admin")}
                subLabel={
                  daemon.update?.detail ||
                  t('deviceAgent.heldHint', 'A package hold or lock on the device. It upgrades once the hold is lifted.')
                }
              />
            ) : (
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
            )}
            </>
          )}
        </List>
        {(elsewhere ? elsewhere === 'POLICY' : !packageless) && (
          <List>
            <ListSubheader>{t('deviceAgent.upgrades', 'Upgrades')}</ListSubheader>
            <DevicePolicyRow deviceId={device.id} name="updates" label={t('deviceSetting.updates', 'Remote upgrades')} />
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
            {daemon.pinned ? (
              <ListItemSetting
                icon="clock-rotate-left"
                label={t('deviceAgent.pinned', 'Rolled back to {{version}}', { version: daemon.pinned.version })}
                subLabel={t('deviceAgent.pinnedHint', 'It stays there, whatever its channel says, until released')}
                button={t('deviceAgent.release', 'Release')}
                disabled={!manage || saving}
                onButtonClick={() => save({ rollback: false })}
              />
            ) : (
              daemon.rollbackTo && (
                <ListItemSetting
                  icon="clock-rotate-left"
                  label={t('deviceAgent.rollback', 'Roll back to {{version}}', { version: daemon.rollbackTo.version })}
                  subLabel={t('deviceAgent.rollbackHint', 'The release before the one its channel gives it')}
                  disabled={!manage || saving}
                  confirm
                  confirmProps={{
                    title: t('deviceAgent.rollbackConfirm', 'Roll back to {{version}}?', {
                      version: daemon.rollbackTo.version,
                    }),
                    children: t(
                      'deviceAgent.rollbackConfirmBody',
                      'The device goes back to {{version}} by a handover, and stays there until you release it.',
                      { version: daemon.rollbackTo.version }
                    ),
                  }}
                  onClick={() => save({ rollback: true })}
                />
              )
            )}
            <ListItemSetting
              icon="pause"
              label={t('deviceAgent.hold', 'Hold at this version')}
              subLabel={t('deviceAgent.holdHint', 'It takes no upgrades until released')}
              toggle={daemon.hold}
              disabled={!manage || saving}
              onClick={() => save({ hold: !daemon.hold })}
            />
          </List>
        )}
      </>
    )
  }

  return (
    <DeviceHeaderMenu>
      <Gutters size={null}>{body()}</Gutters>
    </DeviceHeaderMenu>
  )
}
