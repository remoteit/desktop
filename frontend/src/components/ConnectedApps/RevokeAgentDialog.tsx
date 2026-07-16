import React, { useState } from 'react'
import { Dispatch } from '../../store'
import { useDispatch } from 'react-redux'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material'
import { Notice } from '../Notice'

export const RevokeAgentDialog: React.FC<{ agent: IAuthorizedAgent }> = ({ agent }) => {
  const [open, setOpen] = useState(false)
  const dispatch = useDispatch<Dispatch>()
  const name = agent.clientName || agent.clientId

  function confirm() {
    dispatch.agents.revoke(agent.clientId)
    setOpen(false)
  }

  return (
    <>
      <Button size="small" color="error" onClick={() => setOpen(true)}>
        Revoke
      </Button>
      <Dialog onClose={() => setOpen(false)} open={open} fullWidth>
        <DialogTitle>Revoke access</DialogTitle>
        <DialogContent>
          <Notice severity="warning" fullWidth gutterBottom>
            <b>{name}</b> will be signed out and its tokens revoked immediately. It can request access
            again by signing in.
          </Notice>
          <Typography variant="body2">Revoke access for {name}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={confirm}>
            Revoke
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
