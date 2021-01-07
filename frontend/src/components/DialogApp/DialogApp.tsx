import React from 'react'
import { Typography, Dialog, DialogActions, Button } from '@material-ui/core'

export const DialogApp: React.FC<{
  openApp: boolean
  closeAll: () => void
  link: string
  type?: string
}> = ({ openApp, closeAll, link, type }) => {
  const App = type === 'VNC' ? 'VNC Viewer' : 'Putty'
  const getApp = () => {
    window.open(link)
    closeAll()
  }
  return (
    <>
      <Dialog open={openApp} onClose={closeAll} maxWidth="xs" fullWidth>
        <Typography variant="h1">
          Please install {App} to launch {type} connections.
        </Typography>
        <DialogActions>
          <Button onClick={closeAll} color="primary" size="small" type="button">
            Cancel
          </Button>
          <Button onClick={getApp} variant="contained" color="primary" size="small" type="button">
            Download {App}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
