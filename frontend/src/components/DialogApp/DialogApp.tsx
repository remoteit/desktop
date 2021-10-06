import React from 'react'
import { Dialog, DialogActions, Button, DialogTitle, DialogContent, DialogContentText, makeStyles } from '@material-ui/core'
import { Application } from '../../shared/applications'
import { emit } from '../../services/Controller'
import { ApplicationState, Dispatch } from '../../store'
import { useDispatch, useSelector } from 'react-redux'

export const DialogApp: React.FC<{
  type?: string
  app?: Application
  launchApp: ILaunchApp | undefined
}> = ({ type, app, launchApp }) => {
  const css = useStyles()
  const { ui } = useDispatch<Dispatch>()
  const { requireInstall, openApp } = useSelector((state: ApplicationState) => ({
    requireInstall: state.ui.requireInstall,
    openApp: state.ui.launchState.openApp
  }))

  const closeAll = () => {
    ui.updateLaunchState({ openApp: false, open: false, launch: false })
  }

  const getLinkDownload = () => {
    ui.set({ requireInstall: 'none' })
    switch (requireInstall) {
      case 'putty':
        return ('https://link.remote.it/download/putty')
      case 'vncviewer':
        return 'https://www.realvnc.com/en/connect/download/viewer/windows/'
    }
  }

  const requireDownloadApp = () => !requireInstall || requireInstall !== 'none'

  const App = type === 'VNC' ? 'VNC Viewer' : 'Putty'
  const getApp = () => {
    requireDownloadApp() ? window.open(getLinkDownload()) : emit('launch/app', { launchApp, app })
    closeAll()
  }
  const launchBrowser = () => {
    window.open(app?.command)
    closeAll()
  }
  const title = requireDownloadApp() ? ` ${type} client not found.` : ` ${type} connections `
  const buttonText = requireDownloadApp() ? ` Get ${App} ` : `  launch ${App} `

  return (
    <>
      <Dialog open={openApp} onClose={closeAll} maxWidth="sm" fullWidth>
        <DialogTitle >{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You can use a browser-based {type} launcher to access this connection.
            Alternatively, you can download and install PuTTy
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={getApp} className={css.getApp} variant="contained" color="primary"   >{buttonText}</Button>
          <Button onClick={closeAll} className={css.button} size="small" color="primary">Cancel</Button>
          <Button onClick={launchBrowser} className={css.button} variant="contained" color="primary"  >User browser launcher</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const useStyles = makeStyles({
  getApp: { borderRadius: 3, left: '-120px' },
  button: { borderRadius: 3 }
})