import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import {
  DeviceJoinKey,
  graphQLDeviceJoinKeys,
  graphQLRevokeDeviceJoinKey,
  graphQLRevokeDeviceJoinKeys,
} from '../services/deviceIdentity'
import { useDeviceIdentity } from '../hooks/useDeviceIdentity'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { DynamicButton } from '../buttons/DynamicButton'
import { IssueDeviceJoinKeyDialog } from './IssueDeviceJoinKeyDialog'
import { ColorChip } from './ColorChip'
import { Timestamp } from './Timestamp'
import { Notice } from './Notice'

// At most two keys in force per device (graphql refuses a third): "current" and "next", for a rollover.
export const KEYS_IN_FORCE = 2

// Why a key brings the device back no more: revoked, or past its expiry — by graphql's inForce where it says, rather
// than this machine's clock.
export function keyState(key: DeviceJoinKey, now = Date.now()): 'revoked' | 'expired' | undefined {
  if (key.revoked) return 'revoked'
  if (key.inForce !== undefined) return key.inForce ? undefined : 'expired'
  if (key.expires && Date.parse(key.expires) <= now) return 'expired'
  return undefined
}

/* Whether a device is offered join keys: a Control Link device — one that reports, as graphql counts it —, one that
   holds keys already, or one never online, as a device added ahead is. graphql refuses another in its own words. */
export function joinKeysOffered(
  device: Pick<IDevice, 'lastReported' | 'state'>,
  reports: boolean,
  keys: DeviceJoinKey[]
): boolean {
  return reports || !!keys.length || (!device.lastReported && device.state !== 'active')
}

/* A device's join keys on its settings page (graphql-api docs/PROXY-GROUPS.md §11, "Externally held identity"): for a
   device that starts fresh at every boot, the only way back as itself. Issued with the key shown once, listed with
   their boots, revoked one by one or all at once — and a key with no boot for 30 days flagged, as a suggestion only.
   For whoever manages the device, where the API serves them. */
export const DeviceJoinKeys: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const served = useDeviceIdentity()?.joinKeys
  const deviceSessions = useDeviceSessions()
  const manage = device.permissions.includes('MANAGE') && !device.virtual
  const asked = !!served && deviceSessions && manage
  const reports = !!useDeviceSessionInfo(asked ? device.id : undefined)?.agent
  const [keys, setKeys] = useState<DeviceJoinKey[] | null>()
  const [issuing, setIssuing] = useState(false)
  const [busy, setBusy] = useState<string>()
  const [reason, setReason] = useState<string>()

  const load = useCallback(async () => {
    const read = await graphQLDeviceJoinKeys(device.id)
    setKeys(read === 'ERROR' ? null : read)
  }, [device.id])

  useEffect(() => {
    setKeys(undefined)
    setReason(undefined)
    if (asked) load()
  }, [asked, load])

  if (!asked || !keys || !joinKeysOffered(device, reports, keys)) return null

  const inForce = keys.filter(key => !keyState(key)).length
  const full = inForce >= KEYS_IN_FORCE

  const revoke = async (id?: string) => {
    setBusy(id ?? 'all')
    setReason(undefined)
    const refused = id ? await graphQLRevokeDeviceJoinKey(device.id, id) : await graphQLRevokeDeviceJoinKeys(device.id)
    if (refused !== undefined) setReason(refused || t('deviceJoinKeys.notRevoked', 'The key could not be revoked.'))
    await load()
    setBusy(undefined)
  }

  const states = {
    revoked: t('deviceJoinKeys.revoked', 'Revoked'),
    expired: t('deviceJoinKeys.expired', 'Expired'),
  }

  return (
    <Box sx={{ paddingBottom: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" color="textSecondary">
          {t('deviceJoinKeys.title', 'Device Join Keys')}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {!!inForce && (
            <ConfirmIconButton
              confirm
              confirmProps={{
                color: 'error',
                action: t('deviceJoinKeys.revokeAllAction', 'Revoke All'),
                title: t('deviceJoinKeys.revokeAllTitle', {
                  name: device.name,
                  defaultValue: 'Revoke every join key of "{{name}}"?',
                }),
                children: (
                  <Notice severity="error" gutterBottom fullWidth>
                    {t(
                      'deviceJoinKeys.revokeAllBody',
                      'For a leaked key: every key stops working at once, and the device cannot come back at its next boot until a new key is issued and installed on it. This cannot be undone.'
                    )}
                  </Notice>
                ),
              }}
              name="ban"
              color="danger"
              title={t('deviceJoinKeys.revokeAll', 'Revoke all keys')}
              loading={busy === 'all'}
              disabled={!!busy}
              onClick={() => revoke()}
            />
          )}
          <DynamicButton
            size="small"
            icon="plus"
            title={t('deviceJoinKeys.issue', 'Issue Key')}
            disabled={full || !!busy}
            onClick={() => setIssuing(true)}
          />
        </Stack>
      </Stack>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {t(
          'deviceJoinKeys.description',
          'For a device that starts fresh at every boot: a key brings it back as itself — the same ID, settings, access and history. Each key is shown once, when it is issued.'
        )}
      </Typography>
      {full && (
        <Typography variant="caption" color="textSecondary" component="p" gutterBottom>
          {t(
            'deviceJoinKeys.full',
            'Two keys are in force, the most a device has: revoke one before issuing another. To roll over, issue the next key, install it, see its first boot here, then revoke the old one.'
          )}
        </Typography>
      )}
      {reason && (
        <Notice severity="error" fullWidth gutterBottom>
          {reason}
        </Notice>
      )}
      {keys.length ? (
        <List dense disablePadding>
          {keys.map(key => {
            const state = keyState(key)
            return (
              <ListItem
                key={key.id}
                disableGutters
                data-join-key={key.id}
                sx={{ paddingRight: 6 }}
                secondaryAction={
                  !state && (
                    <ConfirmIconButton
                      confirm
                      confirmProps={{
                        color: 'error',
                        action: t('deviceJoinKeys.revokeAction', 'Revoke Key'),
                        title: t('deviceJoinKeys.revokeTitle', {
                          name: key.name,
                          defaultValue: 'Revoke join key "{{name}}"?',
                        }),
                        children: (
                          <Notice severity="error" gutterBottom fullWidth>
                            {inForce > 1
                              ? t(
                                  'deviceJoinKeys.revokeBody',
                                  'The device cannot boot with this key from now on; the other key in force still brings it back. This cannot be undone.'
                                )
                              : t(
                                  'deviceJoinKeys.revokeLastBody',
                                  'This is its only key in force: the device cannot come back at its next boot until a new key is issued and installed on it. This cannot be undone.'
                                )}
                          </Notice>
                        ),
                      }}
                      name="ban"
                      title={t('deviceJoinKeys.revoke', 'Revoke Key')}
                      loading={busy === key.id}
                      disabled={!!busy}
                      onClick={() => revoke(key.id)}
                    />
                  )
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        variant="body2"
                        sx={{ textDecoration: key.revoked ? 'line-through' : undefined }}
                        color={state ? 'textSecondary' : undefined}
                      >
                        {key.name}
                      </Typography>
                      {state && <ColorChip label={states[state]} size="small" color="grayDark" />}
                      {!state && key.stale && (
                        <ColorChip
                          label={t('deviceJoinKeys.stale', 'No boot in 30 days')}
                          size="small"
                          color="warning"
                        />
                      )}
                    </Stack>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <>
                      <div>
                        {t('deviceJoinKeys.created', 'Issued')}{' '}
                        <Timestamp date={new Date(key.created)} variant="minutes" />
                        {' · '}
                        {key.expires ? (
                          <>
                            {t('deviceJoinKeys.expires', 'Expires')}{' '}
                            <Timestamp date={new Date(key.expires)} variant="minutes" />
                          </>
                        ) : (
                          t('deviceJoinKeys.noExpiry', 'No expiry')
                        )}
                        {key.revoked && (
                          <>
                            {' · '}
                            {t('deviceJoinKeys.revoked', 'Revoked')}{' '}
                            <Timestamp date={new Date(key.revoked)} variant="minutes" />
                          </>
                        )}
                      </div>
                      <div>
                        {key.lastUsed ? (
                          <>
                            {t('deviceJoinKeys.lastBoot', 'Last boot')}{' '}
                            <Timestamp date={new Date(key.lastUsed)} variant="minutes" />
                          </>
                        ) : (
                          t('deviceJoinKeys.neverBooted', 'No boot yet')
                        )}
                        {' · '}
                        {t('deviceJoinKeys.boots', { boots: key.boots, defaultValue: 'Boots: {{boots}}' })}
                      </div>
                      {!state && key.stale && (
                        <Typography variant="caption" color="warning.main" component="div">
                          {t(
                            'deviceJoinKeys.staleSuggestion',
                            'No boot with this key for 30 days: revoke it if nothing holds it any more. Only a suggestion — some devices boot rarely.'
                          )}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            )
          })}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {t('deviceJoinKeys.none', 'No join keys yet.')}
        </Typography>
      )}
      {issuing && <IssueDeviceJoinKeyDialog device={device} onChanged={load} onClose={() => setIssuing(false)} />}
    </Box>
  )
}
