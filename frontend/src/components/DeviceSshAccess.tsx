import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListSubheader,
  TextField,
  Typography,
} from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import {
  DeviceSshRead,
  graphQLDeviceSsh,
  graphQLGrantDeviceSsh,
  graphQLRevokeDeviceSsh,
} from '../services/graphQLDeviceSsh'

/* Who may log in through a device's console by SSH certificate (services/graphQLDeviceSsh), on its details page: for
   whoever manages it. A person is let in as their own account there — r3-<their email's name>, made by the device, admin
   (sudo) or not; an organization's role can make its members admins too — or as a local user. With none set, its owner
   as their own account (admin) or any user — the starting point, kept as grants of their own when someone is added. */
export const DeviceSshAccess: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const { t } = useTranslation()
  const [read, setRead] = useState<DeviceSshRead | null>()
  const [login, setLogin] = useState('')
  const [email, setEmail] = useState('')
  const [admin, setAdmin] = useState(false)
  const [busy, setBusy] = useState(false)
  const load = async () => setRead(await graphQLDeviceSsh(deviceId))

  useEffect(() => {
    setRead(undefined)
    load()
  }, [deviceId])

  if (!read) return null

  const add = async () => {
    setBusy(true)
    if ((await graphQLGrantDeviceSsh(deviceId, email.trim(), login.trim(), admin)) !== 'ERROR') {
      setLogin('')
      setEmail('')
      setAdmin(false)
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

  const as = (grant: DeviceSshRead['grants'][number]) =>
    grant.login === ''
      ? grant.admin
        ? t('deviceSshAccess.ownAdmin', 'as {{account}}, admin', { account: grant.account })
        : t('deviceSshAccess.asUser', 'as {{login}}', { login: grant.account })
      : grant.login === '*'
      ? t('deviceSshAccess.anyUser', 'as any user')
      : t('deviceSshAccess.asUser', 'as {{login}}', { login: grant.login })

  return (
    <List dense sx={{ paddingBottom: 1 }}>
      <ListSubheader disableGutters>{t('deviceSshAccess.title', 'SSH access')}</ListSubheader>
      <ListItem disableGutters>
        <Typography variant="body2" color="textSecondary">
          {t(
            'deviceSshAccess.about',
            'Who may log in through the console, as whom — by certificate, signed for minutes when they connect.'
          )}
        </Typography>
      </ListItem>
      {read.grants.map(grant => (
        <ListItem key={`${grant.login} ${grant.user.id}`} disableGutters>
          <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {grant.user.email ?? grant.user.id}{' '}
            <Box component="span" sx={{ color: 'grayDark.main' }}>
              {as(grant)}
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
          placeholder={t('deviceSshAccess.loginOwn', 'their own account')}
          helperText={t('deviceSshAccess.loginHelp', 'Empty: their own. Or a user there, * for any')}
          value={login}
          onChange={e => setLogin(e.target.value)}
          sx={{ flex: 1 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={admin && !login.trim()}
              disabled={!!login.trim()}
              onChange={e => setAdmin(e.target.checked)}
            />
          }
          label={t('deviceSshAccess.admin', 'Admin')}
          sx={{ marginRight: 0, height: 40 }}
        />
        <Button variant="contained" size="small" disabled={busy || !email.trim()} onClick={add} sx={{ height: 40 }}>
          {t('deviceSshAccess.add', 'Add')}
        </Button>
      </ListItem>
    </List>
  )
}
