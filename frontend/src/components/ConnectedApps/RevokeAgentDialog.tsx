import React, { useState } from 'react'
import { State, Dispatch } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material'
import { Notice } from '../Notice'

// How long a revoked agent's in-flight access token still works (stateless JWT verification):
// revoke kills refresh immediately, but the last access token lives out its TTL.
function accessWindow(seconds: number): string {
  const mins = Math.round(seconds / 60)
  if (mins >= 1) return `${mins} minute${mins === 1 ? '' : 's'}`
  return `${seconds} seconds`
}

export const RevokeAgentDialog: React.FC<{ agent: IAuthorizedAgent; onRevoked?: () => void }> = ({ agent, onRevoked }) => {
  const [open, setOpen] = useState(false)
  const dispatch = useDispatch<Dispatch>()
  const ttl = useSelector((state: State) => state.agents.accessTokenTtlSeconds)
  const name = agent.clientName || agent.clientId

  function confirm() {
    dispatch.agents.revoke(agent.clientId)
    setOpen(false)
    onRevoked?.()
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
            <b>{name}</b> will be signed out. New access is blocked immediately; any session already in
            progress ends within <b>{accessWindow(ttl)}</b>. It can request access again by signing in.
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
