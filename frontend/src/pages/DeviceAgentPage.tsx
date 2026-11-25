import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Collapse, List, ListSubheader } from '@mui/material'
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
import { DevicePolicyRow } from '../components/DeviceSettingRow'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { SelectSetting } from '../components/SelectSetting'
import { Notice } from '../components/Notice'
import { BROWSER_PLATFORM } from '../services/browserClients'
import { belowMinimumText, upkeepText, withAvailable } from '../services/upkeepText'
import { useInterval } from '../hooks/useInterval'
import { useReadCallback, useReadEffect } from '../hooks/useReadAgain'

// How often an upgrade under way is looked at again: its states pass in seconds.
const WATCH_INTERVAL = 3000

/* The device agent (device-package's connectd-go daemon) in the device's Settings: one line with the version it runs
   and where its updates stand, and the rest — what it should run, its channel, rollback and pausing — under Details. */
export const DeviceAgentSection: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const [daemon, setDaemon] = useState<DeviceDaemon | null | 'ERROR' | typeof UNSUPPORTED>()
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  const load = useReadCallback(async () => {
    if (device?.id) setDaemon(await graphQLDeviceDaemon(device.id))
  }, [device?.id])

  useReadEffect(
    again => {
      if (!again) {
        setDaemon(undefined)
        setOpen(false)
      }
      load()
    },
    [load]
  )

  const waiting = typeof daemon === 'object' && !!daemon?.update && daemon.update.state !== 'installed'
  useEffect(() => {
    if (waiting) setOpen(true)
  }, [waiting])

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
        return t('deviceAgent.pendingUpdate', 'Waiting to update to {{version}}', { version })
      case 'started':
        return t('deviceAgent.startedUpdate', 'Updating to {{version}}', { version })
      case 'downloading':
        return t('deviceAgent.downloading', 'Downloading {{version}}', { version })
      case 'installing':
        return t('deviceAgent.installing', 'Installing {{version}}', { version })
      case 'installed':
        return t('deviceAgent.installed', 'Installed {{version}}', { version })
      case 'failed':
        return t('deviceAgent.updateFailed', 'Update to {{version}} failed', { version })
      case 'refused':
        return t('deviceAgent.refusedUpdate', 'Update to {{version}} refused', { version })
      case 'held':
        return held({ update })
          ? t('deviceAgent.paused', 'Updates are paused on this device')
          : t('deviceAgent.notTakenUpdate', '{{version}} not taken here', { version })
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
            'deviceAgent.unsupportedAgent',
            "This server can't show the agent."

          )}
        </Notice>
      )
    if (daemon === 'ERROR')
      return (
        <Notice severity="error" fullWidth>
          {t('deviceAgent.readFailed', "Couldn't read the agent. Try again later.")}
        </Notice>
      )
    if (!daemon)
      return (
        <Notice severity="info" fullWidth>
          {t('deviceAgent.noAgent', 'This device has no agent to show.')}
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
    const summary = elsewhere
      ? withAvailable(t, upkeepText(t, elsewhere, daemon.package?.format).label, daemon.available)
      : packageless
      ? browser
        ? t('deviceAgent.withPortal', 'Updates with the portal')
        : t('deviceAgent.withApp', 'Updated by the app it came with')
      : blocked
      ? t('deviceAgent.paused', 'Updates are paused on this device')
      : daemon.update
      ? stateLabel(daemon.update)
      : daemon.hold
      ? t('deviceAgent.pausedHere', 'Updates paused')
      : upToDate
      ? t('deviceAgent.upToDate', 'Up to date')
      : t('deviceAgent.noUpdateReported', 'No update reported')

    return (
      <>
        {tooOld && (
          <Notice severity="warning" fullWidth>
            {tooOld.label}
            <em>{tooOld.hint}</em>
          </Notice>
        )}
        <List disablePadding>
          <ListItemSetting
            icon="microchip"
            label={running || t('deviceAgent.notReported', 'Not reported')}
            subLabel={running ? summary : t('deviceAgent.notReportedOlder', 'An older agent updates by reinstalling. A newer one reports after it signs in.')}
            button={open ? t('deviceAgent.hideDetails', 'Hide details') : t('deviceAgent.details', 'Details')}
            onButtonClick={() => setOpen(!open)}
          />
        </List>
        <Collapse in={open}>
        <List disablePadding>
          {!!daemon.package?.version && (
            <ListItemSetting
              icon="code"
              label={t('deviceAgent.core', 'Core {{connectd}}', { connectd: daemonVersion(daemon) })}
            />
          )}
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
                  : t('deviceAgent.withApp', 'Updated by the app it came with')
              }
              subLabel={
                browser
                  ? t(
                      'deviceAgent.withPortalNote',
                      'This browser loads the newest client each time.'
                    )
                  : t('deviceAgent.withAppNote', 'Update the app to update the agent.')
              }
            />
          ) : (
            <>
            <ListItemSetting
              icon="bullseye-arrow"
              label={
                daemon.target
                  ? daemon.target.rollback
                    ? t('deviceAgent.targetRolledBack', '{{version}} (rolled back)', { version: daemon.target.version })
                    : daemon.target.version
                  : t('deviceAgent.noTargetVersion', 'The version running now')
              }
              subLabel={
                daemon.target
                  ? t('deviceAgent.targetVersion', 'Version it should run')
                  : t('deviceAgent.noTargetRelease', 'Its channel has no release')
              }
            />
            {blocked ? (
              <ListItemSetting
                icon="lock"
                iconColor="warning"
                label={t('deviceAgent.paused', 'Updates are paused on this device')}
                subLabel={
                  daemon.update?.detail ||
                  t('deviceAgent.pausedHint', 'A package hold on the device. It updates once the hold is lifted.')
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
                    : t('deviceAgent.noUpdateReported', 'No update reported')
                }
                subLabel={daemon.update?.detail || undefined}
              />
            )}
            </>
          )}
        </List>
        {(elsewhere ? elsewhere === 'POLICY' : !packageless) && (
          <List>
            <ListSubheader>{t('deviceAgent.updates', 'Updates')}</ListSubheader>
            <DevicePolicyRow deviceId={device.id} name="updates" label={t('deviceSetting.remoteUpdates', 'Remote updates')} />
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
              subLabel={t('deviceAgent.followAccountNote', 'Use the same channel as your other devices.')}
              button={t('deviceAgent.follow', 'Follow')}
              disabled={!manage || saving}
              onButtonClick={() => save({ channel: '' })}
            />
            {daemon.pinned ? (
              <ListItemSetting
                icon="clock-rotate-left"
                label={t('deviceAgent.pinned', 'Rolled back to {{version}}', { version: daemon.pinned.version })}
                subLabel={t('deviceAgent.pinnedNote', 'Stays on this version until you release it.')}
                button={t('deviceAgent.release', 'Release')}
                disabled={!manage || saving}
                onButtonClick={() => save({ rollback: false })}
              />
            ) : (
              daemon.rollbackTo && (
                <ListItemSetting
                  icon="clock-rotate-left"
                  label={t('deviceAgent.rollback', 'Roll back to {{version}}', { version: daemon.rollbackTo.version })}
                  subLabel={t('deviceAgent.rollbackNote', 'The release before the current one.')}
                  disabled={!manage || saving}
                  confirm
                  confirmProps={{
                    title: t('deviceAgent.rollbackConfirm', 'Roll back to {{version}}?', {
                      version: daemon.rollbackTo.version,
                    }),
                    children: t(
                      'deviceAgent.rollbackBody',
                      'The device goes back to {{version}} and stays there until you release it.',
                      { version: daemon.rollbackTo.version }
                    ),
                  }}
                  onClick={() => save({ rollback: true })}
                />
              )
            )}
            <ListItemSetting
              icon="pause"
              label={t('deviceAgent.pauseUpdates', 'Pause updates')}
              subLabel={t('deviceAgent.pauseNote', 'Keeps this version until you turn this off.')}
              toggle={daemon.hold}
              disabled={!manage || saving}
              onClick={() => save({ hold: !daemon.hold })}
            />
          </List>
        )}
        </Collapse>
      </>
    )
  }

  return body()
}
