import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { graphQLCreateDeviceJoinKey, graphQLRevokeDeviceJoinKeys } from '../services/deviceIdentity'
import { DeviceJoinKeyOnce, DownloadJoinKeyButton } from './DeviceJoinKeyOnce'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = {
  device: Pick<IDevice, 'id' | 'name'>
  // Rotation: every key of the device revoked first, then the new one issued — for a key that may have been copied.
  rotate?: boolean
  onChanged?: () => void // a key was issued or revoked: the list is read again
  onClose: () => void
}

type Form = { name: string; expires: string }

const NAME_MAX = 255

// `datetime-local` takes `YYYY-MM-DDTHH:mm` in local time.
const localInputValue = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

/* Issues a device join key and shows it once (graphql's createDeviceJoinKey): a name, and an optional expiry. Mounted
   only while open, so the key lives in this dialog's state alone until Done unmounts it. With `rotate` it revokes the
   device's keys first; should the new key then be refused, the dialog says the device has none in force. */
export const IssueDeviceJoinKeyDialog: React.FC<Props> = ({ device, rotate, onChanged, onClose }) => {
  const { t } = useTranslation()
  const [form, setForm] = useState<Form>({ name: '', expires: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [reason, setReason] = useState<string>()
  const [revoked, setRevoked] = useState(false)
  const [working, setWorking] = useState(false)
  const [created, setCreated] = useState<{ name: string; key: string }>()

  const change = (field: keyof Form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: event.target.value })
    setErrors({ ...errors, [field]: undefined })
  }

  const validate = () => {
    const found: typeof errors = {}
    const name = form.name.trim()
    if (!name) found.name = t('issueDeviceJoinKey.nameRequired', 'A name is required')
    else if (name.length > NAME_MAX)
      found.name = t('issueDeviceJoinKey.nameTooLong', { max: NAME_MAX, defaultValue: 'At most {{max}} characters' })
    if (form.expires && !(new Date(form.expires) > new Date()))
      found.expires = t('issueDeviceJoinKey.expiresPast', 'A time in the future')
    setErrors(found)
    return !Object.keys(found).length
  }

  const issue = async (event: React.FormEvent) => {
    event.preventDefault()
    if (working || !validate()) return
    setReason(undefined)
    setWorking(true)
    const name = form.name.trim()
    if (rotate && !revoked) {
      const refused = await graphQLRevokeDeviceJoinKeys(device.id)
      if (refused !== undefined) {
        setWorking(false)
        setReason(refused || t('issueDeviceJoinKey.notRevoked', 'The keys could not be revoked. Nothing changed.'))
        return
      }
      setRevoked(true)
      onChanged?.()
    }
    const result = await graphQLCreateDeviceJoinKey(
      device.id,
      name,
      form.expires ? new Date(form.expires).toISOString() : undefined
    )
    setWorking(false)
    if (result.key) {
      setCreated({ name, key: result.key })
      onChanged?.()
    } else setReason(result.reason || t('issueDeviceJoinKey.notIssued', 'The key could not be issued.'))
  }

  return (
    <Dialog open onClose={created || working ? undefined : onClose} maxWidth="sm" fullWidth>
      {created ? (
        <>
          <DialogTitle>{t('issueDeviceJoinKey.createdTitle', 'Device Join Key Issued')}</DialogTitle>
          <DialogContent>
            <DeviceJoinKeyOnce name={created.name} joinKey={created.key}>
              {rotate &&
                t('issueDeviceJoinKey.rotatedInstall', {
                  name: device.name,
                  defaultValue:
                    'Every earlier key of {{name}} is revoked. Install this key where the device gets its key, and restart it.',
                })}
            </DeviceJoinKeyOnce>
          </DialogContent>
          <DialogActions>
            <DownloadJoinKeyButton name={created.name} joinKey={created.key} />
            <Button variant="contained" onClick={onClose}>
              {t('common.done', 'Done')}
            </Button>
          </DialogActions>
        </>
      ) : (
        <form onSubmit={issue} noValidate>
          <DialogTitle>
            {rotate
              ? t('issueDeviceJoinKey.rotateTitle', 'Rotate Device Join Keys')
              : t('issueDeviceJoinKey.title', 'Issue Device Join Key')}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {rotate
                ? t('issueDeviceJoinKey.rotateDescription', {
                    name: device.name,
                    defaultValue:
                      'Every key of {{name}} is revoked, and a new one issued and shown once. Until the new key is installed and the device restarts with it, the device cannot come back — and neither can a copy of an old key.',
                  })
                : t('issueDeviceJoinKey.description', {
                    name: device.name,
                    defaultValue:
                      'A machine holding the key comes back as {{name}} at every boot, and nothing else. The key is shown once, when it is issued.',
                  })}
            </Typography>
            {revoked && (
              <Notice severity="error" fullWidth gutterTop>
                {t(
                  'issueDeviceJoinKey.noneInForce',
                  'Every earlier key is revoked: the device cannot come back until a new key is issued.'
                )}
              </Notice>
            )}
            {reason && (
              <Notice severity="error" fullWidth gutterTop>
                {reason}
              </Notice>
            )}
            <TextField
              variant="filled"
              label={t('issueDeviceJoinKey.name', 'Name')}
              value={form.name}
              onChange={change('name')}
              error={!!errors.name}
              helperText={
                errors.name ||
                t('issueDeviceJoinKey.nameHelp', 'Where it is kept, such as a secret store, a USB stick or an image')
              }
              inputProps={{ maxLength: NAME_MAX }}
              disabled={working}
              autoFocus
              required
              fullWidth
              margin="normal"
            />
            <TextField
              variant="filled"
              type="datetime-local"
              label={t('issueDeviceJoinKey.expires', 'Expires')}
              value={form.expires}
              onChange={change('expires')}
              error={!!errors.expires}
              helperText={
                errors.expires ||
                t('issueDeviceJoinKey.expiresHelp', 'Optional: the device cannot boot with it after this')
              }
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: localInputValue(new Date()) }}
              disabled={working}
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={onClose} disabled={working}>
              {revoked ? t('common.close', 'Close') : t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="contained" color={rotate ? 'error' : 'primary'} disabled={working}>
              {working ? (
                <>
                  <Icon name="spinner-third" spin size="sm" inlineLeft />
                  {t('issueDeviceJoinKey.issuing', 'Issuing...')}
                </>
              ) : rotate && !revoked ? (
                t('issueDeviceJoinKey.rotate', 'Revoke All and Issue')
              ) : (
                t('issueDeviceJoinKey.issue', 'Issue')
              )}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  )
}
