import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { Dispatch } from '../store'
import { PendingOrganizationClosure } from '../models/accounts'
import { refusalOf } from '../services/graphQL'
import { graphQLCloseOrganization, graphQLRequestOrganizationClosure } from '../services/graphQLMutation'

export function CloseOrganizationDialog({
  organizationId,
  name,
  onClose,
}: PendingOrganizationClosure & { onClose: () => void }) {
  const { t } = useTranslation()
  const history = useHistory()
  const { accounts } = useDispatch<Dispatch>()
  const [devices, setDevices] = useState<number>()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fallback = t('closeOrganization.error', 'Could not close the organization. Try again.')

  async function sendCode() {
    setBusy(true)
    setError('')
    try {
      const result = await graphQLRequestOrganizationClosure(organizationId)
      if (result === 'ERROR' || 'reason' in result) {
        setError(refusalOf(result) || fallback)
        return
      }
      setDevices(result.data.data.requestOrganizationClosure.devices)
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (devices === undefined) return sendCode()
    if (!code.trim()) return
    setBusy(true)
    setError('')
    try {
      const result = await graphQLCloseOrganization(organizationId, code)
      if (result === 'ERROR' || 'reason' in result) {
        setError(refusalOf(result) || fallback)
        void accounts.fetchOrganizationClosures()
        return
      }
      if (!result.data?.data?.closeOrganization) {
        setError(fallback)
        return
      }
      const wasActive = await accounts.organizationClosed(organizationId)
      onClose()
      if (wasActive) history.push('/devices')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={submit}>
        <DialogTitle>{t('closeOrganization.title', { name, defaultValue: 'Close {{name}}' })}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography paragraph>
            {t(
              'closeOrganization.warning',
              'Closing the organization permanently removes its data and revokes access. Its devices move to the holding account.'
            )}
          </Typography>
          {devices !== undefined && (
            <>
              <Typography paragraph>
                {t('closeOrganization.confirm', {
                  count: devices,
                  defaultValue_one:
                    '{{count}} device will move to the holding account. Enter the code sent to your email.',
                  defaultValue_other:
                    '{{count}} devices will move to the holding account. Enter the code sent to your email.',
                })}
              </Typography>
              <TextField
                autoFocus
                fullWidth
                label={t('closeOrganization.code', 'Confirmation code')}
                value={code}
                onChange={event => setCode(event.target.value)}
                autoComplete="one-time-code"
                inputProps={{ maxLength: 6 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>
            {t('buttons.cancel', 'Cancel')}
          </Button>
          {devices !== undefined && (
            <Button onClick={sendCode} disabled={busy}>
              {t('closeOrganization.resend', 'Send a new code')}
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            color={devices === undefined ? 'primary' : 'error'}
            disabled={busy || (devices !== undefined && code.trim().length !== 6)}
          >
            {devices === undefined
              ? t('closeOrganization.sendCode', 'Send confirmation code')
              : t('closeOrganization.submit', 'Close organization')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
