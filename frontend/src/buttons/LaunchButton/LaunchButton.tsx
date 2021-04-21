import React, { useState, useEffect } from 'react'
import { ApplicationState } from '../../store'
import { useApplication } from '../../hooks/useApplication'
import { setConnection } from '../../helpers/connectionHelper'
import { launchPutty, launchVNC, launchRemoteDesktop } from '../../services/Browser'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { PromptModal } from '../../components/PromptModal'
import { Dispatch } from '../../store'
import { FontSize } from '../../styling'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import { makeStyles, IconButton, Tooltip, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { DialogApp } from '../../components/DialogApp'

type Props = {
  connection?: IConnection
  service?: IService
  menuItem?: boolean
  size?: FontSize
}

export const LaunchButton: React.FC<Props> = ({ connection, service, menuItem, size = 'md' }) => {
  const { requireInstall, loading, path } = useSelector((state: ApplicationState) => ({
    requireInstall: state.ui.requireInstall,
    path: state.ui.launchPath,
    loading: state.ui.launchLoading,
  }))
  const { ui } = useDispatch<Dispatch>()
  const [launch, setLaunch] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const [openApp, setOpenApp] = useState<boolean>(false)
  const [downloadLink, setDownloadLink] = useState<string>('')
  const hidden = !connection?.enabled

  const app = useApplication('launch', service, connection)
  const css = useStyles()

  useEffect(() => {
    if (launch) {
      app.prompt ? setOpen(true) : launchBrowser()
    }
    switch (requireInstall) {
      case 'putty':
        setDownloadLink('https://link.remote.it/download/putty')
        setOpenApp(true)
        ui.set({ requireInstall: 'none' })
        break
      case 'vncviewer':
        setDownloadLink('https://www.realvnc.com/en/connect/download/viewer/windows/')
        setOpenApp(true)
        ui.set({ requireInstall: 'none' })
        break
    }
  }, [requireInstall, launch, app])

  if (hidden || !app) return null

  const launchBrowser = () => {
    let launchApp: ILaunchApp | undefined
    if (launchPutty(service?.typeID)) {
      launchApp = {
        port: app.connection?.port,
        host: app.connection?.host,
        path,
        application: 'putty',
      }
    }
    if (launchVNC(service?.typeID)) {
      launchApp = {
        port: app.connection?.port,
        host: app.connection?.host,
        username: app.connection?.username,
        path,
        application: 'vncviewer',
      }
    }
    if (launchRemoteDesktop(service?.typeID)) {
      launchApp = {
        port: app.connection?.port,
        host: app.connection?.host,
        username: app.connection?.username,
        path: 'desktop',
        application: 'remoteDesktop',
      }
    }
    launchApp ? emit('launch/app', launchApp) : window.open(app.command)
    closeAll()
  }

  const onSubmit = (tokens: ILookup<string>) => {
    connection && setConnection({ ...connection, ...tokens })
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
