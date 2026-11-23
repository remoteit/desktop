import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
  TextField,
} from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { FormField } from './FormField'
import { Gutters } from './Gutters'
import { Icon } from './Icon'
import { ListItemCheckbox } from './ListItemCheckbox'
import {
  DeviceSshGrant,
  DeviceSshRead,
  graphQLDeviceSsh,
  graphQLGrantDeviceSsh,
  graphQLRevokeDeviceSsh,
  graphQLSetDeviceSshAccount,
  validExistingAccount,
  validSshHandle,
} from '../services/graphQLDeviceSsh'

/* Who may log in through a device's console by SSH certificate (services/graphQLDeviceSsh), on its details page: for
   whoever manages it. A person is let in as their own account there — r3-<their handle or email's name>, made by the
   device, admin (sudo) or not; an organization's role can make its members admins too — or as a local user. With none
   set, its owner as their own account (admin) or any user — the starting point, kept as grants of their own when someone
   is added. Whoever manages the device may name a person's own account there (OwnAccountName): by a handle, or as an
   account the device already has (presence-server docs/ssh-account-names.md). */
export const DeviceSshAccess: React.FC<{ deviceId: string; untitled?: boolean }> = ({ deviceId, untitled }) => {
  const { t } = useTranslation()
  const [read, setRead] = useState<DeviceSshRead | null>()
  const [login, setLogin] = useState('')
  const [email, setEmail] = useState('')
  const [admin, setAdmin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [naming, setNaming] = useState<string>() // the person whose own account is being named
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

  const as = (grant: DeviceSshGrant) =>
    grant.login === '' && grant.existing
      ? t('deviceSshAccess.ownExisting', 'as {{account}}, an account already on the device', { account: grant.account })
      : grant.login === ''
      ? grant.admin
        ? t('deviceSshAccess.ownAdministrator', 'as {{account}}, administrator', { account: grant.account })
        : t('deviceSshAccess.asUser', 'as {{login}}', { login: grant.account })
      : grant.login === '*'
      ? t('deviceSshAccess.anyUser', 'as any user')
      : t('deviceSshAccess.asUser', 'as {{login}}', { login: grant.login })

  return (
    <List disablePadding>
      {!untitled && <ListSubheader>{t('deviceSshAccess.terminalAccess', 'Terminal access')}</ListSubheader>}
      <ListItem dense>
        <ListItemIcon>
          <Icon name="terminal" size="md" fixedWidth />
        </ListItemIcon>
        <ListItemText
          secondary={t('deviceSshAccess.terminalNote', 'Who can sign in through the terminal, and as which account.')}
        />
      </ListItem>
      {read.grants.map(grant => (
        <React.Fragment key={`${grant.login} ${grant.user.id}`}>
          <ListItem dense sx={{ paddingRight: '90px' }}>
            <ListItemIcon>
              <Icon name="user" size="md" fixedWidth />
            </ListItemIcon>
            <ListItemText
              primary={grant.user.email ?? grant.user.id}
              secondary={
                read.fallback ? (
                  <>
                    {as(grant)} — {t('deviceSshAccess.ownerDefault', 'the owner, by default')}
                  </>
                ) : (
                  as(grant)
                )
              }
            />
            <ListItemSecondaryAction>
              {grant.login === '' && (
                <IconButton
                  icon="pen"
                  size="sm"
                  disabled={busy}
                  title={t('deviceSshAccess.name', 'Name their account')}
                  onClick={() => setNaming(naming === grant.user.id ? undefined : grant.user.id)}
                />
              )}
              {!read.fallback && (
                <IconButton
                  icon="times"
                  size="sm"
                  disabled={busy}
                  title={t('deviceSshAccess.revoke', 'Remove')}
                  onClick={() => revoke(grant.login, grant.user.id)}
                />
              )}
            </ListItemSecondaryAction>
          </ListItem>
          {grant.login === '' && naming === grant.user.id && (
            <OwnAccountName
              deviceId={deviceId}
              grant={grant}
              busy={busy}
              setBusy={setBusy}
              onCancel={() => setNaming(undefined)}
              onSaved={async () => {
                setNaming(undefined)
                await load()
              }}
            />
          )}
        </React.Fragment>
      ))}
      <FormField>
        <TextField
          variant="filled"
          label={t('deviceSshAccess.email', 'Email')}
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </FormField>
      <FormField help={t('deviceSshAccess.loginHelp', 'Empty: their own. Or a user there, * for any')}>
        <TextField
          variant="filled"
          label={t('deviceSshAccess.login', 'Local user')}
          placeholder={t('deviceSshAccess.loginOwn', 'their own account')}
          InputLabelProps={{ shrink: true }}
          value={login}
          onChange={e => setLogin(e.target.value)}
        />
      </FormField>
      <ListItemCheckbox
        label={t('deviceSshAccess.admin', 'Admin')}
        checked={admin && !login.trim()}
        disabled={!!login.trim()}
        onClick={setAdmin}
      />
      <Gutters top="sm">
        <Button variant="contained" disabled={busy || !email.trim()} onClick={add}>
          {t('deviceSshAccess.add', 'Add')}
        </Button>
      </Gutters>
    </List>
  )
}

// The names that reach the machine's administrator: allowed, with a warning (a * grant reaches them already).
const ADMINISTRATORS = ['root', 'administrator', 'admin']

/* Names a person's own account on the device: a handle — the stage's r3 prefix before it, made by the device; renaming
   one already made renames it there and ends what it runs — or an account the device already has, by its whole name,
   which remote.it never makes, locks or admins: removing their access stops new logins and leaves what it runs, and its
   sudo is whatever the machine gives it. graphql checks the name and says why it cannot be had. */
const OwnAccountName: React.FC<{
  deviceId: string
  grant: DeviceSshGrant
  busy: boolean // the panel's: nothing else on it is done while a name is saved
  setBusy: (busy: boolean) => void
  onCancel: () => void
  onSaved: () => void
}> = ({ deviceId, grant, busy, setBusy, onCancel, onSaved }) => {
  const { t } = useTranslation()
  const [existing, setExisting] = useState(grant.existing)
  const [name, setName] = useState(grant.existing ? grant.account ?? '' : '')
  const [reason, setReason] = useState<string>()
  const wanted = existing ? name.trim() : name.trim().toLowerCase()
  const invalid = !wanted || !(existing ? validExistingAccount(wanted) : validSshHandle(wanted))

  const save = async () => {
    setBusy(true)
    const refused = await graphQLSetDeviceSshAccount(deviceId, grant.user.id, wanted, existing)
    setBusy(false)
    if (refused !== undefined) setReason(refused || t('deviceSshAccess.nameFailed', 'Could not name their account'))
    else onSaved()
  }

  const note = existing
    ? ADMINISTRATORS.includes(wanted.toLowerCase())
      ? t(
          'deviceSshAccess.existingAdministrator',
          "This is the machine's administrator: they will have all of it. Removing their access stops new logins only."
        )
      : t(
          'deviceSshAccess.existingNote',
          'Removing their access stops new logins only. Remote.It won’t lock this account or end what it runs. It keeps whatever sudo the machine gives it.'
        )
    : grant.account && !grant.existing
    ? t(
        'deviceSshAccess.renameNote',
        'Made by the device with the r3 prefix. Renaming {{account}} ends what it runs now.',
        { account: grant.account }
      )
    : t('deviceSshAccess.handleNote', 'Made by the device with the r3 prefix.')

  return (
    <>
      <FormField help={reason ? undefined : note}>
        <TextField
          variant="filled"
          autoFocus
          label={
            existing
              ? t('deviceSshAccess.existingLabel', 'Account on the device')
              : t('deviceSshAccess.handleLabel', 'Handle')
          }
          value={name}
          error={!!reason}
          helperText={reason}
          onChange={e => {
            setName(e.target.value)
            setReason(undefined)
          }}
        />
      </FormField>
      <ListItemCheckbox
        label={t('deviceSshAccess.existing', 'Already on the device')}
        checked={existing}
        onClick={checked => {
          setExisting(checked)
          setReason(undefined)
        }}
      />
      <Gutters top="sm">
        <Button variant="contained" disabled={busy || invalid} onClick={save}>
          {t('deviceSshAccess.save', 'Save')}
        </Button>
        <Button disabled={busy} onClick={onCancel}>
          {t('deviceSshAccess.cancel', 'Cancel')}
        </Button>
      </Gutters>
    </>
  )
}
