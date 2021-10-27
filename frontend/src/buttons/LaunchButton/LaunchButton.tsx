import React, { useState, useEffect } from 'react'
import { MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { isWindows, getApplicationObj, isMac } from '../../services/Browser'
import { ApplicationState, Dispatch } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { useApplication } from '../../hooks/useApplication'
import { setConnection } from '../../helpers/connectionHelper'
import { PromptModal } from '../../components/PromptModal'
import { IconButton } from '../../buttons/IconButton'
import { DataButton } from '../DataButton'
import { DialogApp } from '../../components/DialogApp'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import { Color, FontSize } from '../../styling'
import { LAUNCH_TYPE } from '../../shared/applications'

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

export const LaunchButton: React.FC<Props> = ({ connection, service, menuItem, dataButton, onLaunch, ...props }) => {
  const { ui } = useDispatch<Dispatch>()

  const { loading, path, launchState } = useSelector((state: ApplicationState) => ({
    path: state.ui.launchPath,
    loading: state.ui.launchLoading,
    launchState: state.ui.launchState,
  }))

  const [launchApp, setLaunchApp] = useState<ILaunchApp>()
  const disabled = !connection?.enabled
  const [openLaunchApplication, setOpenLaunchApplication] = useState<boolean>(false)
  const app = useApplication(connection && connection.launchType === 'COMMAND' ? 'copy' : 'launch', service, connection)
  useEffect(() => {
    if (openLaunchApplication && !loading) {
      launchApplication()
      setOpenLaunchApplication(false)
    }
  }, [loading, openLaunchApplication])

  if (!app || !connection?.enabled) return null

  const launchApplication = () => {
    const applicationObj = getApplicationObj(service?.typeID, app.connection?.username)
    const hostProps = {
      port: app.connection?.port,
      host: app.connection?.host,
      path,
    }
    if (applicationObj?.application) {
      setLaunchApp({
        ...hostProps,
        ...applicationObj,
      })
    }
    ui.updateLaunchState({ openApp: true })
    onLaunch && onLaunch()
  }

  const onSubmit = (tokens: ILookup<string>) => {
    connection && setConnection({ ...connection, ...tokens })
    ui.updateLaunchState({ open: false })
    // here is using preview because we don't know when setConnection respond with the socket emit
    onOpenApp(app.preview(tokens))
  }

  const clickHandler = () => {
    if (app.prompt > 0) {
      ui.updateLaunchState({ open: true })
      return
    }
    onOpenApp()
  }

  const closeAll = () => {
    ui.updateLaunchState({ openApp: false, open: false, launch: false })
  }

  const onOpenApp = (command?: string) => {
    const currentCommand = command || app.command
    const applicationObj = getApplicationObj(service?.typeID, app.connection?.username)
    if (isWindows() && applicationObj.application !== '') {
      const applicationObj = getApplicationObj(service?.typeID, app.connection?.username)
      ui.set({ launchLoading: true, requireInstall: 'none' })
      emit('check/app', { application: applicationObj.application, cmd: app.checkApplicationCmd })
      setOpenLaunchApplication(true)
    } else {
      if (!isWindows()) {
        app.defaultTemplateCmd = isMac() ? app.launchDarwin.replace('[commandTemplate]', currentCommand) : app.launchUnix.replace('[commandTemplate]', currentCommand)
      }
      app.launchType === LAUNCH_TYPE.URL ? window.open(currentCommand) : emit('launch/app',
        { launchApp: { path }, app })

    }
  }

  const LaunchIcon = (
    <Icon
      name={loading ? 'spinner-third' : 'launch'}
      spin={loading}
      size={props.size}
      color={props.color}
      type={props.type}
      fixedWidth
    />
  )

  return (
    <>
      {menuItem ? (
        <MenuItem dense onClick={clickHandler} disabled={disabled || loading}>
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
        <IconButton
          {...props}
          onClick={clickHandler}
          disabled={loading || disabled}
          icon={loading ? 'spinner-third' : 'launch'}
        />
      )}
      <PromptModal app={app} open={launchState.open} onClose={closeAll} onSubmit={onSubmit} />
      <DialogApp launchApp={launchApp} app={app} type={service?.type} />
    </>
  )
}
