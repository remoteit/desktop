import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { Dispatch } from '../store'

export function CreateOrganizationDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { accounts } = useDispatch<Dispatch>()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submission = useRef<{ name: string; id: string }>()
  const validName = name.trim()

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !validName) return
    if (submission.current?.name !== validName) submission.current = { name: validName, id: crypto.randomUUID() }
    setBusy(true)
    setError('')
    try {
      const reason = await accounts.createOrganization({ name: validName, submissionId: submission.current.id })
      if (reason === undefined) onClose()
      else setError(reason || t('createOrganization.error', 'Could not create the organization. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <form onSubmit={submit}>
        <DialogTitle>{t('createOrganization.title', 'Create organization')}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            value={name}
            onChange={event => setName(event.target.value)}
            label={t('createOrganization.name', 'Organization name')}
            inputProps={{ maxLength: 256 }}
            disabled={busy}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>
            {t('buttons.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={busy || !validName}>
            {t('createOrganization.submit', 'Create organization')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
