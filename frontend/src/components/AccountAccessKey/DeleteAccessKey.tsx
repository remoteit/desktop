import React, { useState } from 'react'
import { Dispatch } from '../../store'
import { useDispatch } from 'react-redux'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography } from '@mui/material'
import { IconButton } from '../../buttons/IconButton'
import { Notice } from '../Notice'

export const DeleteAccessKey: React.FC<{ deleteKey: IAccessKey }> = ({ deleteKey }) => {
  const [open, setOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const dispatch = useDispatch<Dispatch>()

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
      {!deleteKey.enabled && <IconButton icon="trash-alt" onClick={() => setOpen(true)} size="lg" />}
      <Dialog onClose={handleClose} open={open} fullWidth>
        <DialogTitle>Delete Access Key</DialogTitle>
        <form onSubmit={confirmDelete}>
          <DialogContent>
            <Notice severity="danger" fullWidth gutterBottom>
              This action is permanent and cannot be undone.
            </Notice>
            <Typography variant="body1" gutterBottom>
              Do you wish to delete key <b>{deleteKey.key}</b>?
            </Typography>
            <TextField
              required
              autoFocus
              fullWidth
              variant="filled"
              label="Type DELETE to confirm"
              onChange={e => setDeleteText(e.currentTarget.value)}
              value={deleteText}
            />
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" type="submit" disabled={deleteText !== 'DELETE'}>
              Delete
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}
