import React from 'react'
import { DialogTitle, Dialog, DialogActions, Button } from '@material-ui/core'

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
        <DialogTitle>
          Please install {App} to launch {type} connections.
        </DialogTitle>
        <DialogActions>
          <Button onClick={closeAll} color="primary">
            Cancel
          </Button>
          <Button onClick={getApp} variant="contained" color="primary">
            Download {App}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
