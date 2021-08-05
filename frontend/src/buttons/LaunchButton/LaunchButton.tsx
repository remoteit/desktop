import React, { useState, useEffect } from 'react'
import { MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { launchPutty, launchVNC, launchRemoteDesktop } from '../../services/Browser'
import { ApplicationState } from '../../store'
import { useApplication } from '../../hooks/useApplication'
import { setConnection } from '../../helpers/connectionHelper'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { PromptModal } from '../../components/PromptModal'
import { DataButton } from '../DataButton'
import { IconButton } from '../../buttons/IconButton'
import { DialogApp } from '../../components/DialogApp'
import { Dispatch } from '../../store'
import { FontSize, Color } from '../../styling'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'

type Props = {
  connection?: IConnection
  service?: IService
  menuItem?: boolean
  dataButton?: boolean
  size?: FontSize
  color?: Color
  type?: IconType
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onLaunch?: () => void
}

export const LaunchButton: React.FC<Props> = ({
  connection,
  service,
  menuItem,
  dataButton,
  size = 'md',
  onLaunch,
  ...props
}) => {
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

  const app = useApplication('launch', service, connection)

  useEffect(() => {
    if (launch) {
      app.prompt ? setOpen(true) : launchBrowser()
      onLaunch && onLaunch()
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

  if (!app || !connection?.enabled) return null

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

  const clickHandler = () => setLaunch(true)

  const LaunchIcon = (
    <Icon
      name={loading ? 'spinner-third' : app.icon}
      spin={loading}
      size={size}
      color={props.color}
      type={props.type}
      fixedWidth
    />
  )

  return (
    <>
      {menuItem ? (
        <MenuItem dense onClick={clickHandler} disabled={loading}>
          <ListItemIcon>{LaunchIcon}</ListItemIcon>
          <ListItemText primary={app.contextTitle} />
        </MenuItem>
      ) : dataButton ? (
        <DataButton
          value={app.command}
          label={app.contextTitle}
          title={app.contextTitle}
          icon={LaunchIcon}
          onClick={clickHandler}
        />
      ) : (
        <IconButton {...props} onClick={clickHandler} disabled={loading} icon={loading ? 'spinner-third' : app.icon} />
      )}
      <PromptModal app={app} open={open} onClose={closeAll} onSubmit={onSubmit} />
      <DialogApp openApp={openApp} closeAll={closeAll} link={downloadLink} type={service?.type} />
    </>
  )
}
