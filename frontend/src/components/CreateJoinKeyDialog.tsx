import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { IDeviceProduct, IJoinKeyInput } from '../models/products'
import { JOIN_KEY_ENV, JOIN_KEY_FILE_ENV } from '../constants'
import { CopyCodeBlock } from './CopyCodeBlock'
import { Notice } from './Notice'
import { Icon } from './Icon'
import { dispatch } from '../store'
import { PRODUCT_JOIN_KEY_FILE, downloadJoinKey } from '../helpers/joinKeyFile'
import { JoinKeyContainer } from './JoinKeyContainer'

type Props = {
  product: Pick<IDeviceProduct, 'id' | 'name' | 'lifecycle'>
  // How the key is made: through the store, unless given (a product outside it — remote.it's proxy product).
  onCreate?: (input: IJoinKeyInput) => Promise<{ key?: string; reason?: string }>
  onClose: () => void
}

type Form = { name: string; expires: string; joinRate: string; maxJoins: string }

const EMPTY: Form = { name: '', expires: '', joinRate: '', maxJoins: '' }
const NAME_MAX = 255
const INT_MAX = 2_147_483_647

// `datetime-local` takes `YYYY-MM-DDTHH:mm` in local time.
const localInputValue = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

const wholeNumber = (value: string) => /^\d+$/.test(value.trim()) && Number(value) >= 1 && Number(value) <= INT_MAX

// Creates a join key and shows it once. Mounted only while open, so the key lives in this dialog's state alone, from
// graphql's answer until Done unmounts it: it is never put in the store, never logged, and cannot be shown again. While
// the key is being made or is on screen only Done closes the dialog, so a stray click outside cannot throw away the
// one copy.
export const CreateJoinKeyDialog: React.FC<Props> = ({ product, onCreate, onClose }) => {
  const { t } = useTranslation()
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [reason, setReason] = useState<string>()
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<{ name: string; key: string }>()

  const change = (field: keyof Form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: event.target.value })
    setErrors({ ...errors, [field]: undefined })
  }

  const validate = () => {
    const found: typeof errors = {}
    const name = form.name.trim()
    if (!name) found.name = t('createJoinKey.nameRequired', 'A name is required')
    else if (name.length > NAME_MAX)
      found.name = t('createJoinKey.nameTooLong', { max: NAME_MAX, defaultValue: 'At most {{max}} characters' })
    if (form.expires && !(new Date(form.expires) > new Date()))
      found.expires = t('createJoinKey.expiresPast', 'A time in the future')
    if (form.joinRate && !wholeNumber(form.joinRate))
      found.joinRate = t('createJoinKey.wholeNumber', 'A whole number of 1 or more')
    if (form.maxJoins && !wholeNumber(form.maxJoins))
      found.maxJoins = t('createJoinKey.wholeNumber', 'A whole number of 1 or more')
    setErrors(found)
    return !Object.keys(found).length
  }

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    if (creating || !validate()) return
    setReason(undefined)
    setCreating(true)
    const name = form.name.trim()
    const input: IJoinKeyInput = {
      productId: product.id,
      name,
      expires: form.expires ? new Date(form.expires).toISOString() : undefined,
      joinRate: form.joinRate ? Number(form.joinRate) : undefined,
      maxJoins: form.maxJoins ? Number(form.maxJoins) : undefined,
    }
    const result = await (onCreate ?? dispatch.products.createJoinKey)(input)
    setCreating(false)
    if (result.key) setCreated({ name, key: result.key })
    else if (result.reason) setReason(result.reason)
  }

  return (
    <Dialog open onClose={created || creating ? undefined : onClose} maxWidth="sm" fullWidth>
      {created ? (
        <>
          <DialogTitle>{t('createJoinKey.createdTitle', 'Join Key Created')}</DialogTitle>
          <DialogContent>
            <Notice severity="warning" fullWidth gutterBottom>
              <strong>{t('createJoinKey.onceTitle', 'Copy or download this key now')}</strong>
              <em>
                {t(
                  'createJoinKey.onceBody',
                  'It will not be shown again: remote.it keeps only its public half. If it is lost, revoke it and create another.'
                )}
              </em>
            </Notice>
            <CopyCodeBlock label={created.name} value={created.key} sx={{ marginBottom: 2 }} />
            <Typography variant="body2" color="textSecondary">
              {t('createJoinKey.use', {
                env: JOIN_KEY_ENV,
                file: JOIN_KEY_FILE_ENV,
                defaultValue:
                  'Give it to the machine as {{env}}, or save it in a file only the daemon can read and name the file in {{file}}.',
              })}
            </Typography>
            <JoinKeyContainer
              kind="product"
              prefix={PRODUCT_JOIN_KEY_FILE}
              name={created.name}
              ephemeral={product.lifecycle === 'ephemeral'}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => downloadJoinKey(PRODUCT_JOIN_KEY_FILE, created.name, created.key)}>
              <Icon name="download" inlineLeft />
              {t('createJoinKey.download', 'Download')}
            </Button>
            <Button variant="contained" onClick={onClose}>
              {t('common.done', 'Done')}
            </Button>
          </DialogActions>
        </>
      ) : (
        <form onSubmit={create} noValidate>
          <DialogTitle>{t('createJoinKey.title', 'Create Join Key')}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {t('createJoinKey.description', {
                product: product.name,
                defaultValue:
                  'A machine holding the key creates new devices of {{product}}, and nothing else. The key is shown once, when it is created.',
              })}
            </Typography>
            {reason && (
              <Notice severity="error" fullWidth gutterTop>
                {reason}
              </Notice>
            )}
            <TextField
              variant="filled"
              label={t('createJoinKey.name', 'Name')}
              value={form.name}
              onChange={change('name')}
              error={!!errors.name}
              helperText={
                errors.name || t('createJoinKey.nameHelp', 'Where it is used, such as a fleet, a site or a CI pipeline')
              }
              inputProps={{ maxLength: NAME_MAX }}
              disabled={creating}
              autoFocus
              required
              fullWidth
              margin="normal"
            />
            <TextField
              variant="filled"
              type="datetime-local"
              label={t('createJoinKey.expires', 'Expires')}
              value={form.expires}
              onChange={change('expires')}
              error={!!errors.expires}
              helperText={errors.expires || t('createJoinKey.expiresHelp', 'Optional: it creates no device after this')}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: localInputValue(new Date()) }}
              disabled={creating}
              fullWidth
              margin="normal"
            />
            <TextField
              variant="filled"
              type="number"
              label={t('createJoinKey.joinRate', 'Joins a minute')}
              placeholder="10"
              value={form.joinRate}
              onChange={change('joinRate')}
              error={!!errors.joinRate}
              helperText={
                errors.joinRate ||
                t('createJoinKey.joinRateHelp', 'Optional: how many devices it may create a minute (10 if left empty)')
              }
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 1, step: 1 }}
              disabled={creating}
              fullWidth
              margin="normal"
            />
            <TextField
              variant="filled"
              type="number"
              label={t('createJoinKey.maxJoins', 'Maximum joins')}
              value={form.maxJoins}
              onChange={change('maxJoins')}
              error={!!errors.maxJoins}
              helperText={
                errors.maxJoins || t('createJoinKey.maxJoinsHelp', 'Optional: how many devices it may create in all')
              }
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 1, step: 1 }}
              disabled={creating}
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={onClose} disabled={creating}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={creating}>
              {creating ? (
                <>
                  <Icon name="spinner-third" spin size="sm" inlineLeft />
                  {t('createJoinKey.creating', 'Creating...')}
                </>
              ) : (
                t('createJoinKey.create', 'Create')
              )}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  )
}
