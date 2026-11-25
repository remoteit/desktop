import React, { useState } from 'react'
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
import { useReadEffect } from '../hooks/useReadAgain'

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
  const [refreshDue, setRefreshDue] = useState(false)
  const pending = refreshDue || !!data?.portalUserMode.some(binding => binding.state === 'pending')
  const refresh = () => setRevision(value => value + 1)

  useReadEffect(
    again => {
      let current = true
      let reading = false
      let first = true
      const read = async () => {
        if (reading) return
        reading = true
        const result = await readPortalUserMode(deviceId).catch(() => 'ERROR' as const)
        reading = false
        if (!current) return
        // A poll that fails keeps what is shown; the first read as another sign-in, failing, must not.
        if (result === 'ERROR' && again && first) setData(undefined)
        first = false
        setFailed(result === 'ERROR')
        if (result !== 'ERROR') {
          setData(result)
          setRefreshDue(false)
          setApproval(code =>
            code &&
            result?.portalUserMode.some(
              binding => binding.id === code.id && binding.state === 'pending' && binding.requiresOsAdmin
            )
              ? code
              : undefined
          )
        }
      }
      void read()
      const timer = pending ? setInterval(read, 3000) : undefined
      return () => {
        current = false
        clearInterval(timer)
      }
    },
    [deviceId, revision, pending]
  )

  const readError = failed && (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={refresh}>
          {t('portalUserMode.retry', 'Retry')}
        </Button>
      }
    >
      {t('portalUserMode.loadFailed', 'Couldn’t load full access. Try again.')}
    </Alert>
  )
  if (data === null && !failed) return <>{legacy}</>
  if (!data) return readError ? <ListItem>{readError}</ListItem> : null

  const { portalUserMode: bindings, userModeEligibility: eligibility } = data
  const whole = bindings.find(binding => binding.name === null && binding.state === 'active')
  const scopes = eligibility.accounts.filter(
    scope =>
      !bindings.some(binding => binding.name === scope.name || (!!scope.account && binding.account === scope.account))
  )
  if (eligibility.canRequestWholeDevice && !bindings.some(binding => binding.name === null))
    scopes.unshift({ name: null, account: null, requiresOsAdmin: true })
  const key = (scope: UserModeScope) => (scope.name === null ? '*' : `${scope.name}/${scope.account ?? ''}`)
  const label = (scope: UserModeScope) => scope.name ?? t('portalUserMode.wholeDevice', 'Every account')
  const selected = scopes.find(scope => key(scope) === choice)

  const submit = async () => {
    if (!confirmation || busy) return
    setBusy(true)
    setSaveError('')
    try {
      if ('enable' in confirmation) {
        const result = await requestPortalUserMode(deviceId, confirmation.enable)
        if (!result || result === 'ERROR' || 'reason' in result) {
          setSaveError(
            result && result !== 'ERROR' ? result.reason : t('portalUserMode.saveFailed', 'Couldn’t change full access. Try again.')
          )
          return
        }
        if (result.approvalCode) setApproval({ id: result.id, code: result.approvalCode })
        setChoice('')
      } else {
        if (!(await revokePortalUserMode(deviceId, confirmation.revoke.id))) {
          setSaveError(t('portalUserMode.saveFailed', 'Couldn’t change full access. Try again.'))
          return
        }
        if (approval?.id === confirmation.revoke.id) setApproval(undefined)
      }
      setConfirmation(undefined)
      setRefreshDue(true)
      refresh()
    } catch {
      setSaveError(t('portalUserMode.saveFailed', 'Couldn’t change full access. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ListItem disableGutters>
      <Stack spacing={1.5} sx={{ py: 1.5, width: '100%' }}>
        <Typography variant="subtitle1">{t('deviceUserMode.label', 'Full access')}</Typography>
        {readError}
        {eligibility.blockedByLocalPolicy && (
          <Alert severity="info">
            {t('portalUserMode.policyOff', 'The device’s OS administrator turned off full access.')}
          </Alert>
        )}
        {bindings.map(binding => (
          <Box key={binding.id} display="flex" alignItems="center" gap={2}>
            <Box flex={1}>
              <Typography variant="body2">
                {t('portalUserMode.binding', '{{account}} · Full access as {{person}}', {
                  account: label(binding),
                  person: binding.person.email ?? binding.person.id,
                })}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {binding.state === 'active'
                  ? binding.name === null
                    ? t('portalUserMode.activeDefault', 'On for every account without its own sign-in')
                    : t('portalUserMode.active', 'On')
                  : binding.requiresOsAdmin
                  ? t('portalUserMode.waitingAdmin', 'Waiting for the device’s administrator')
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
                : t('portalUserMode.revoke', 'Turn off')}
            </Button>
          </Box>
        ))}
        {approval && (
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
        {!approval && bindings.some(binding => binding.state === 'pending' && binding.requiresOsAdmin) && (
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
              label={t('portalUserMode.scope', 'Turn on full access for')}
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
              {t('portalUserMode.enable', 'Turn on')}
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
                {!('enable' in confirmation)
                  ? t('portalUserMode.revokeTitle', 'Turn off full access?')
                  : confirmation.enable.name === null
                  ? t('portalUserMode.confirmTitleWhole', 'Turn on full access for every account?')
                  : t('portalUserMode.confirmTitle', 'Turn on full access for {{account}}?', {
                      account: confirmation.enable.name,
                    })}
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
                            'People and processes on this device can use your Remote.It access when their account has no sign-in. Accounts added later are included.'
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
                          'New connections from {{name}} then use the whole device’s full access, as {{person}}.',
                          { name: confirmation.revoke.name, person: whole.person.email ?? whole.person.id }
                        )
                      : t('portalUserMode.confirmRevoke', 'Turning it off ends the connections that use it.')}
                  </Typography>
                )}
              </DialogContent>
              <DialogActions>
                <Button disabled={busy} onClick={() => setConfirmation(undefined)}>
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button variant="contained" disabled={busy} onClick={submit}>
                  {'enable' in confirmation
                    ? t('portalUserMode.enable', 'Turn on')
                    : t('portalUserMode.revoke', 'Turn off')}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Stack>
    </ListItem>
  )
}
