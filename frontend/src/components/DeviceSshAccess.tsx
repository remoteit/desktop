import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, List, ListItem, ListSubheader, Switch, TextField, Typography } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import {
  DeviceSshRead,
  graphQLDeviceSsh,
  graphQLGrantDeviceSsh,
  graphQLRevokeDeviceSsh,
  graphQLSetDeviceSshCertificates,
} from '../services/graphQLDeviceSsh'

/* Who may log in to a device by SSH certificate, as which local user (services/graphQLDeviceSsh), on its details page:
   for whoever manages it. With none set, its owner as any user — the starting point, kept as a grant of its own when
   someone is added. Certificates are turned on in the device's sshd from here, or on the device (remoteit-device
   ssh-certificates on); a device that refuses remote configuration (ssh_remote_config no) is switched only there. The
   switch shows what the device says it did, waiting for it after a change. */
export const DeviceSshAccess: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const { t } = useTranslation()
  const [read, setRead] = useState<DeviceSshRead | null>()
  const [login, setLogin] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [switching, setSwitching] = useState<boolean>()

  const load = async () => setRead(await graphQLDeviceSsh(deviceId))

  useEffect(() => {
    setRead(undefined)
    load()
  }, [deviceId])

  if (!read) return null

  const add = async () => {
    setBusy(true)
    if ((await graphQLGrantDeviceSsh(deviceId, login.trim() || '*', email.trim())) !== 'ERROR') {
      setLogin('')
      setEmail('')
    }
    await load()
    setBusy(false)
  }

  const revoke = async (grantLogin: string, userId: string) => {
    setBusy(true)
    await graphQLRevokeDeviceSsh(deviceId, grantLogin, userId)
    await load()
    setBusy(false)
  }

  // The device turns sshd over and says so within seconds: wait for it, up to half a minute.
  const turn = async (on: boolean) => {
    setSwitching(on)
    if ((await graphQLSetDeviceSshCertificates(deviceId, on)) !== 'ERROR') {
      for (let waited = 0; waited < 30_000; waited += 2_000) {
        await new Promise(resolve => setTimeout(resolve, 2_000))
        const now = await graphQLDeviceSsh(deviceId)
        setRead(now)
        if (!now || now.on === on) break
      }
    }
    setSwitching(undefined)
  }

  const status =
    switching !== undefined
      ? switching
        ? t('deviceSshAccess.turningOn', 'Turning logins by certificate on…')
        : t('deviceSshAccess.turningOff', 'Turning logins by certificate off…')
      : read.on
      ? t(
          'deviceSshAccess.on',
          'Logins by certificate are on: the people below sign in from the terminal, no password.'
        )
      : t('deviceSshAccess.off', 'Logins by certificate are off on this device.')
  // The account's switch, not what the device did: the device says why.
  const refused = switching === undefined && read.certificates !== null && read.certificates !== read.on && read.refused

  const as = (grantLogin: string) =>
    grantLogin === '*'
      ? t('deviceSshAccess.anyUser', 'as any user')
      : t('deviceSshAccess.asUser', 'as {{login}}', { login: grantLogin })

  return (
    <List dense sx={{ paddingBottom: 1 }}>
      <ListSubheader disableGutters>{t('deviceSshAccess.title', 'SSH access')}</ListSubheader>
      <ListItem disableGutters sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" color={read.on ? 'textPrimary' : 'textSecondary'}>
            {status}
          </Typography>
          {refused && (
            <Typography variant="caption" color="error" component="div">
              {t('deviceSshAccess.refused', 'The device did not: {{reason}}', { reason: read.refused })}
            </Typography>
          )}
          {read.localOnly && (
            <Typography variant="caption" color="textSecondary" component="div">
              {t(
                'deviceSshAccess.localOnly',
                'This device is switched only on itself: sudo remoteit-device ssh-certificates on'
              )}
            </Typography>
          )}
        </Box>
        <Switch
          checked={switching ?? read.on}
          disabled={read.localOnly || switching !== undefined}
          onChange={e => turn(e.target.checked)}
          inputProps={{ 'aria-label': t('deviceSshAccess.switch', 'Logins by certificate') }}
        />
      </ListItem>
      {read.grants.map(grant => (
        <ListItem key={`${grant.login} ${grant.user.id}`} disableGutters>
          <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {grant.user.email ?? grant.user.id}{' '}
            <Box component="span" sx={{ color: 'grayDark.main' }}>
              {as(grant.login)}
            </Box>
            {read.fallback && (
              <Box component="span" sx={{ color: 'grayDark.main' }}>
                {' '}
                — {t('deviceSshAccess.fallback', 'its owner, the starting point')}
              </Box>
            )}
          </Box>
          {!read.fallback && (
            <IconButton
              icon="times"
              size="sm"
              disabled={busy}
              title={t('deviceSshAccess.revoke', 'Remove')}
              onClick={() => revoke(grant.login, grant.user.id)}
            />
          )}
        </ListItem>
      ))}
      <ListItem disableGutters sx={{ gap: 1, alignItems: 'flex-start' }}>
        <TextField
          size="small"
          label={t('deviceSshAccess.email', 'Email')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          sx={{ flex: 2 }}
        />
        <TextField
          size="small"
          label={t('deviceSshAccess.login', 'Local user')}
          placeholder={t('deviceSshAccess.loginAny', '* for any')}
          value={login}
          onChange={e => setLogin(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button variant="contained" size="small" disabled={busy || !email.trim()} onClick={add} sx={{ height: 40 }}>
          {t('deviceSshAccess.add', 'Add')}
        </Button>
      </ListItem>
    </List>
  )
}
