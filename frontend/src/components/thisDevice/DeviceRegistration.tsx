import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { shallowEqual, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { selectCanRegister, selectOrganizationOptions } from '../../selectors/organizations'
import { State } from '../../store'
import { DeviceStatus, ThisDevice } from '../../services/thisDevice'
import {
  createAppRegistration,
  readDeviceSetupAccount,
  verifyDeviceRegistrationAccount,
} from '../../services/deviceOnboarding'

const dismissed = new Set<string>()

export const DeviceRegistration: React.FC<{ device: ThisDevice; status?: DeviceStatus }> = ({ device, status }) => {
  const userId = useSelector((state: State) => state.user.id)
  const handoff = useLocation().pathname.match(/^\/this-device\/setup\/([a-f0-9]{48})$/)?.[1]
  const key = status?.registration ? [status.stage, userId, handoff].join(':') : ''
  const [added, setAdded] = useState<string>()
  const { t } = useTranslation()
  return (
    <>
      {added && (
        <Alert severity="success" onClose={() => setAdded(undefined)} sx={{ mx: 2, mb: 1 }}>
          {t('deviceRegistration.added', 'Device added to {{account}}.', { account: added })}
        </Alert>
      )}
      {status?.registration && userId && !status.device?.uid && !added && (
        <RegistrationForm
          key={key}
          device={device}
          registration={status.registration}
          setupKey={key}
          handoff={handoff}
          onAdded={setAdded}
        />
      )}
    </>
  )
}

const RegistrationForm: React.FC<{
  device: ThisDevice
  registration: NonNullable<DeviceStatus['registration']>
  handoff?: string
  setupKey: string
  onAdded: (account: string) => void
}> = ({ device, registration, handoff, setupKey, onAdded }) => {
  const { t } = useTranslation()
  const user = useSelector((state: State) => state.user)
  const organizations = useSelector(
    (state: State) =>
      // The device is registered by the page's own person: only to an organization their own sign-in reaches.
      selectOrganizationOptions(state).filter(
        org => !org.disabled && !org.via && org.id !== user.id && selectCanRegister(state, org.id)
      ),
    shallowEqual
  )
  const [open, setOpen] = useState(!dismissed.has(setupKey))
  const [selectedId, setAccountId] = useState(user.id)
  const accountId = registration.pendingAccount || selectedId
  const [name, setName] = useState(registration.name)
  const [loadingTarget, setLoadingTarget] = useState(!!handoff)
  const [missingTarget, setMissingTarget] = useState(false)
  useEffect(() => {
    if (!handoff) return
    let cancelled = false
    readDeviceSetupAccount(handoff)
      .then(id => {
        if (cancelled) return
        if (id) setAccountId(id)
        else setMissingTarget(true)
      })
      .catch(() => {
        if (!cancelled) setMissingTarget(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingTarget(false)
      })
    return () => {
      cancelled = true
    }
  }, [handoff])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const submitted = useRef(false)
  const confirmedName = registration.pendingAccount ? registration.name : name.trim()

  const organization = organizations.find(org => org.id === accountId)
  const accountName = organization?.name || organization?.email || user.email
  const eligible = accountId === user.id || !!organization
  const close = () => {
    dismissed.add(setupKey)
    setOpen(false)
  }

  async function add(event: React.FormEvent) {
    event.preventDefault()
    if (submitted.current || loadingTarget || !confirmedName || !eligible) return
    submitted.current = true
    setError(undefined)
    setBusy(true)
    try {
      const current = await device.call('status', {})
      if (!current.registration || current.device?.uid) return
      const mobile = device.info.shell === 'capacitor'
      const pendingDesktopSetup = current.registration.pendingAccount && !mobile
      if (pendingDesktopSetup) await verifyDeviceRegistrationAccount(accountId)
      // Phones retain the first attempt's proof, so the service can recover a lost reply
      // before redeeming a fresh code when the saved one has expired.
      const code = pendingDesktopSetup
        ? undefined
        : await createAppRegistration(accountId, confirmedName, current.registration.platform, mobile)
      await device.call('device.register', { code, name: confirmedName, accountId })
      onAdded(accountName)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('deviceRegistration.failed', 'Could not add this device. Try again.')
      )
    } finally {
      submitted.current = false
      setBusy(false)
    }
  }

  return (
    <Stack alignItems="flex-start" sx={{ mx: 2, mb: 1 }}>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        {t('deviceRegistration.open', 'Add this device')}
      </Button>
      <Dialog open={open} onClose={busy ? undefined : close} fullWidth maxWidth="xs">
        <form onSubmit={add}>
          <DialogTitle>
            {t('deviceRegistration.title', 'Add this device to {{account}}?', { account: accountName })}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {registration.pendingAccount && !eligible ? (
                <Alert severity="warning">
                  {t(
                    'deviceRegistration.pendingUnavailable',
                    'Sign in with an account that can finish adding this device.'
                  )}
                </Alert>
              ) : (
                (missingTarget || (!loadingTarget && !eligible)) && (
                  <Alert severity="warning">
                    {t(
                      'deviceRegistration.targetUnavailable',
                      'Choose an account. The setup link’s account is unavailable.'
                    )}
                  </Alert>
                )
              )}
              <Typography variant="body2">
                {t('deviceRegistration.signedInAs', 'Signed in as {{email}}', { email: user.email })}
              </Typography>
              <TextField
                select
                label={t('deviceRegistration.owner', 'Owning account')}
                value={eligible ? accountId : ''}
                disabled={busy || loadingTarget || !!registration.pendingAccount}
                onChange={event => {
                  setAccountId(event.target.value)
                  setError(undefined)
                }}
              >
                <MenuItem value={user.id}>{user.email}</MenuItem>
                {organizations.map(org => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name || org.email}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={t('deviceRegistration.name', 'Device name')}
                value={registration.pendingAccount ? registration.name : name}
                onChange={event => setName(event.target.value)}
                disabled={busy || !!registration.pendingAccount}
                required
              />
              {device.info.shell === 'capacitor' && (
                <Typography variant="body2">
                  {t('deviceRegistration.vpn', 'Allow the system VPN prompt so Remote.It can register this device.')}
                </Typography>
              )}
              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={close} disabled={busy}>
              {t('deviceRegistration.later', 'Later')}
            </Button>
            <Button type="submit" variant="contained" disabled={busy || loadingTarget || !eligible || !confirmedName}>
              {busy ? t('deviceRegistration.adding', 'Adding device…') : t('deviceRegistration.add', 'Add device')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  )
}
