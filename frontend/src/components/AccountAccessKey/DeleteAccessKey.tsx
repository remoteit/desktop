import React, { useState } from 'react'
import { Dispatch } from '../../store'
import { useDispatch } from 'react-redux'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { IconButton } from '../../buttons/IconButton'
import { Notice } from '../Notice'

export const DeleteAccessKey: React.FC<{ deleteKey: IAccessKey }> = ({ deleteKey }) => {
  const [open, setOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()

  function handleClose() {
    setOpen(false)
    setDeleteText('')
  }

  function confirmDelete(e) {
    e.preventDefault()
    if (deleteText !== 'DELETE') return
    dispatch.keys.deleteAccessKeys(deleteKey.key)
    handleClose()
  }

  return (
    <>
      {!deleteKey.enabled && (
        <IconButton
          inlineLeft
          icon="trash"
          size="base"
          color="grayDarker"
          buttonBaseSize="small"
          onClick={() => setOpen(true)}
        />
      )}
      <Dialog onClose={handleClose} open={open} fullWidth>
        <DialogTitle>{t('deleteAccessKey.title', 'Delete Access Key')}</DialogTitle>
        <form onSubmit={confirmDelete}>
          <DialogContent>
            <Notice severity="error" fullWidth gutterBottom>
              {t('deleteAccessKey.warning', 'This action is permanent and cannot be undone.')}
            </Notice>
            <Typography variant="body1" gutterBottom>
              {t('deleteAccessKey.confirmText', 'Do you wish to delete key')} <b>{deleteKey.key}</b>?
            </Typography>
            <TextField
              required
              autoFocus
              fullWidth
              variant="filled"
              label={t('deleteAccessKey.confirmLabel', 'Type DELETE to confirm')}
              onChange={e => setDeleteText(e.currentTarget.value)}
              value={deleteText}
            />
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={handleClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="contained" color="error" type="submit" disabled={deleteText !== 'DELETE'}>
              {t('common.delete', 'Delete')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}
