import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItem,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { CopyIconButton } from '../buttons/CopyIconButton'
import {
  PortalUserMode,
  readPortalUserMode,
  requestPortalUserMode,
  revokePortalUserMode,
  UserModeScope,
} from '../services/devicePortalUserMode'

type Binding = PortalUserMode['portalUserMode'][number]
type Confirmation = { enable: UserModeScope } | { revoke: Binding }

export const DevicePortalUserMode: React.FC<{ deviceId: string; legacy: React.ReactNode; command: string }> = ({
  deviceId,
  legacy,
  command,
}) => {
  const { t } = useTranslation()
  const [data, setData] = useState<PortalUserMode | null>()
  const [failed, setFailed] = useState(false)
  const [revision, setRevision] = useState(0)
  const [choice, setChoice] = useState('')
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmation, setConfirmation] = useState<Confirmation>()
  const [approval, setApproval] = useState<{ id: string; code: string }>()
  const pending = data?.portalUserMode.some(binding => binding.state === 'pending')

  useEffect(() => {
    let current = true
    const read = async () => {
      const result = await readPortalUserMode(deviceId).catch(() => 'ERROR' as const)
      if (!current) return
      setFailed(result === 'ERROR')
      if (result !== 'ERROR') setData(result)
    }
    void read()
    const timer = pending ? setInterval(read, 3000) : undefined
    return () => {
      current = false
      clearInterval(timer)
    }
  }, [deviceId, revision, pending])

  if (data === null && !failed) return <>{legacy}</>
  if (failed && !data)
    return (
      <ListItem>
        <Alert severity="error">{t('portalUserMode.loadFailed', 'Could not load user mode.')}</Alert>
      </ListItem>
    )
  if (!data) return null

  const { portalUserMode: bindings, userModeEligibility: eligibility } = data
  const whole = bindings.find(binding => binding.name === null && binding.state === 'active')
  const scopes = eligibility.accounts.filter(
    scope =>
      !bindings.some(binding => binding.name === scope.name || (!!scope.account && binding.account === scope.account))
  )
  if (eligibility.canRequestWholeDevice && !bindings.some(binding => binding.name === null))
    scopes.unshift({ name: null, account: null, requiresOsAdmin: true })
  const key = (scope: UserModeScope) => (scope.name === null ? '*' : `${scope.name}/${scope.account ?? ''}`)
  const label = (scope: UserModeScope) => scope.name ?? t('portalUserMode.wholeDevice', 'Whole device')
  const selected = scopes.find(scope => key(scope) === choice)
  const approvalPending =
    approval &&
    bindings.some(binding => binding.id === approval.id && binding.state === 'pending' && binding.requiresOsAdmin)

  const submit = async () => {
    if (!confirmation || busy) return
    setBusy(true)
    setSaveError('')
    try {
      if ('enable' in confirmation) {
        const result = await requestPortalUserMode(deviceId, confirmation.enable)
        if (!result || result === 'ERROR' || 'reason' in result) {
          setSaveError(
            result && result !== 'ERROR' ? result.reason : t('portalUserMode.saveFailed', 'Could not update user mode.')
          )
          return
        }
        if (result.approvalCode) setApproval({ id: result.id, code: result.approvalCode })
        setChoice('')
      } else {
        if (!(await revokePortalUserMode(deviceId, confirmation.revoke.id))) {
          setSaveError(t('portalUserMode.saveFailed', 'Could not update user mode.'))
          return
        }
        if (approval?.id === confirmation.revoke.id) setApproval(undefined)
      }
      setConfirmation(undefined)
      setRevision(value => value + 1)
    } catch {
      setSaveError(t('portalUserMode.saveFailed', 'Could not update user mode.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ListItem disableGutters>
      <Stack spacing={1.5} sx={{ py: 1.5, width: '100%' }}>
        <Typography variant="subtitle1">{t('deviceUserMode.label', 'User mode')}</Typography>
        {eligibility.blockedByLocalPolicy && (
          <Alert severity="info">
            {t('portalUserMode.policyOff', 'The OS administrator turned off user mode on this device.')}
          </Alert>
        )}
        {bindings.map(binding => (
          <Box key={binding.id} display="flex" alignItems="center" gap={2}>
            <Box flex={1}>
              <Typography variant="body2">
                {label(binding)} · {binding.person.email ?? binding.person.id}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {binding.state === 'active'
                  ? binding.name === null
                    ? t('portalUserMode.activeDefault', 'Default for accounts without their own sign-in')
                    : t('portalUserMode.active', 'Active')
                  : binding.requiresOsAdmin
                  ? t('portalUserMode.waitingAdmin', 'Waiting for OS admin approval')
                  : t('portalUserMode.pending', 'Waiting for the device')}
              </Typography>
            </Box>
            <Button
              size="small"
              color="secondary"
              disabled={busy}
              onClick={() => {
                setSaveError('')
                setConfirmation({ revoke: binding })
              }}
            >
              {binding.state === 'pending'
                ? t('portalUserMode.cancelRequest', 'Cancel request')
                : t('portalUserMode.revoke', 'Revoke sign-in')}
            </Button>
          </Box>
        ))}
        {approvalPending && (
          <Alert severity="info">
            {t(
              'portalUserMode.approve',
              'On the device, open a terminal as an OS administrator, run the command below, and enter this approval code.'
            )}
            <Box component="code" display="block" sx={{ mt: 1 }}>
              {command} user-mode approve
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <code>{approval.code}</code>
              <CopyIconButton value={approval.code} />
            </Box>
          </Alert>
        )}
        {!approvalPending && bindings.some(binding => binding.state === 'pending' && binding.requiresOsAdmin) && (
          <Typography variant="body2" color="textSecondary">
            {t(
              'portalUserMode.missingCode',
              'Use the approval code from the request. If you no longer have the code, cancel the request and submit it again.'
            )}
          </Typography>
        )}
        {!!scopes.length && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <TextField
              select
              size="small"
              fullWidth
              label={t('portalUserMode.scope', 'Enable user mode for')}
              value={selected ? choice : ''}
              onChange={event => setChoice(event.target.value)}
            >
              {scopes.map(scope => (
                <MenuItem key={key(scope)} value={key(scope)}>
                  {label(scope)}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              disabled={!selected || busy}
              onClick={() => {
                setSaveError('')
                if (selected) setConfirmation({ enable: selected })
              }}
            >
              {t('portalUserMode.enable', 'Enable')}
            </Button>
          </Stack>
        )}
        {!eligibility.blockedByLocalPolicy && (
          <Typography variant="body2" color="textSecondary">
            {t(
              'portalUserMode.localSignIn',
              'You can also open Remote.It on the device and sign in from your OS account.'
            )}
          </Typography>
        )}
        <Dialog open={!!confirmation} onClose={() => !busy && setConfirmation(undefined)}>
          {confirmation && (
            <>
              <DialogTitle>
                {'enable' in confirmation ? label(confirmation.enable) : t('portalUserMode.revoke', 'Revoke sign-in')}
              </DialogTitle>
              <DialogContent>
                {saveError && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {saveError}
                  </Alert>
                )}
                {'enable' in confirmation ? (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      {confirmation.enable.name === null
                        ? t(
                            'portalUserMode.confirmWhole',
                            'People and processes on this device can use your Remote.It access wherever an account has no sign-in of its own. This also applies to accounts added later.'
                          )
                        : t(
                            'portalUserMode.confirmAccount',
                            'Anyone and any process using {{name}} can reach what you can in Remote.It.',
                            { name: confirmation.enable.name }
                          )}
                    </Typography>
                    {confirmation.enable.requiresOsAdmin && (
                      <Typography variant="body2">
                        {t(
                          'portalUserMode.adminRequired',
                          'An OS administrator must approve this request on the device.'
                        )}
                      </Typography>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2">
                    {confirmation.revoke.name && whole
                      ? t(
                          'portalUserMode.confirmFallback',
                          'New connections from {{name}} will use the whole-device identity {{person}}.',
                          { name: confirmation.revoke.name, person: whole.person.email ?? whole.person.id }
                        )
                      : t('portalUserMode.confirmRevoke', 'Revoking this binding ends the sessions using it.')}
                  </Typography>
                )}
              </DialogContent>
              <DialogActions>
                <Button disabled={busy} onClick={() => setConfirmation(undefined)}>
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button variant="contained" disabled={busy} onClick={submit}>
                  {'enable' in confirmation
                    ? t('portalUserMode.enable', 'Enable')
                    : t('portalUserMode.revoke', 'Revoke sign-in')}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Stack>
    </ListItem>
  )
}
