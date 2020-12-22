import React, { useState, useEffect } from 'react'
import { ApplicationState } from '../../store'
import { useApplication } from '../../shared/applications'
import { setConnection } from '../../helpers/connectionHelper'
import { launchPutty, launchVNC } from '../../services/Browser'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { PromptModal } from '../../components/PromptModal'
import { Dispatch } from '../../store'
import { FontSize } from '../../styling'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import {
  makeStyles,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogActions,
  Button,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core'
import { DialogApp } from '../../components/DialogApp'

type Props = {
  connection?: IConnection
  service?: IService
  menuItem?: boolean
  size?: FontSize
}

export const LaunchButton: React.FC<Props> = ({ connection, service, menuItem, size = 'md' }) => {
  const { requireInstallPutty, requireInstallVNC, loading, pathPutty, pathVNC } = useSelector(
    (state: ApplicationState) => ({
      requireInstallPutty: state.ui.requireInstallPutty,
      requireInstallVNC: state.ui.requireInstallVNC,
      pathPutty: state.ui.pathPutty,
      pathVNC: state.ui.pathVNC,
      loading: state.ui.loading,
    })
  )
  const { ui, backend } = useDispatch<Dispatch>()
  const [launch, setLaunch] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const [openApp, setOpenApp] = useState<boolean>(false)
  const [downloadLink, setDownloadLink] = useState<string>('')

  const app = useApplication('launch', service, connection)
  const css = useStyles()

  useEffect(() => {
    if (launch) {
      app.prompt ? setOpen(true) : launchBrowser()
    }
    if (requireInstallPutty) {
      setDownloadLink('https://link.remote.it/download/putty')
      setOpenApp(true)
      ui.set({ requireInstallPutty: false })
    }
    if (requireInstallVNC) {
      setDownloadLink('https://www.realvnc.com/es/connect/download/viewer/windows/')
      setOpenApp(true)
      ui.set({ requireInstallVNC: false })
    }
  }, [requireInstallPutty, requireInstallVNC, launch, app])

  if (!connection || !connection.active || !app) return null

  const launchBrowser = () => {
    try {
      switch (service?.type) {
        case 'SSH':
          launchPutty(service?.typeID)
            ? emit('service/launch', { command: app.command, pathPutty })
            : window.open(app.command)
          break
        case 'VNC':
          launchVNC()
            ? emit('service/launch/vnc', {
                port: app.connection?.port,
                host: app.connection?.host,
                username: app.connection?.username,
                pathVNC,
              })
            : window.open(app.command)
          break
      }
    } catch (error) {
      backend.set({ globalError: `Could not launch ${app.command}. Invalid URL.` })
    }
    closeAll()
  }

  const onSubmit = (tokens: ILookup<string>) => {
    setConnection({ ...connection, ...tokens })
  }

  const closeAll = () => {
    setLaunch(false)
    setOpen(false)
    setOpenApp(false)
  }

  const LaunchIcon = (
    <Icon
      className={app.iconRotate ? css.rotate : ''}
      name={loading ? 'spinner-third' : app.icon}
      spin={loading}
      size={size}
    />
  )

  return (
    <>
      {menuItem ? (
        <MenuItem dense onClick={() => setLaunch(true)}>
          <ListItemIcon>{LaunchIcon}</ListItemIcon>
          <ListItemText primary={`Launch ${app.title}`} />
        </MenuItem>
      ) : (
        <Tooltip title={`Launch ${app.title}`}>
          <IconButton onClick={() => setLaunch(true)} disabled={loading}>
            {LaunchIcon}
          </IconButton>
        </Tooltip>
      )}

      <PromptModal app={app} open={open} onClose={closeAll} onSubmit={onSubmit} />

      <DialogApp openApp={openApp} closeAll={closeAll} link={downloadLink} type={service?.type} />
    </>
  )
}

const useStyles = makeStyles({
  rotate: { transform: 'rotate(-45deg)' },
})
