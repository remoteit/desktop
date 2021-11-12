import React, { useState, useEffect } from 'react'
import { MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { isWindows, getApplicationObj, isMac, safeWindowOpen } from '../../services/Browser'
import { ApplicationState, Dispatch } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { useApplication } from '../../hooks/useApplication'
import { setConnection } from '../../helpers/connectionHelper'
import { PromptModal } from '../../components/PromptModal'
import { IconButton } from '../../buttons/IconButton'
import { DataButton } from '../DataButton'
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

  const app = useApplication(connection && connection.launchType === 'COMMAND' ? 'copy' : 'launch', service, connection)
  const disabled = !connection?.enabled


  if (!app || !connection?.enabled) return null


  const onSubmit = (tokens: ILookup<string>) => {
    connection && setConnection({ ...connection, ...tokens })
    ui.launchState({ prompt: false })
    onOpenApp(app.preview(tokens))
  }

  const clickHandler = () => {
    if (app.prompt) ui.launchState({ prompt: true })
    else onOpenApp()
    onLaunch && onLaunch()
  }

  const closeAll = () => {
    ui.launchState({ openApp: false, prompt: false, launch: false })
  }

  const onOpenApp = (command?: string) => {
    let currentCommand = command || app.command
    const applicationObj = getApplicationObj(service?.typeID, app.connection?.username)
    if (isWindows() && applicationObj.application !== '') {
      if (app.launchType === LAUNCH_TYPE.URL) return safeWindowOpen(currentCommand)
      emit('launch/app', { launchApp: { path }, command: currentCommand })
    } else {
      currentCommand = isMac()
        ? app.launchDarwin.replace('[commandTemplate]', currentCommand)
        : app.launchUnix.replace('[commandTemplate]', currentCommand)

      app.launchType === LAUNCH_TYPE.URL
        ? safeWindowOpen(currentCommand)
        : emit('launch/app', { launchApp: { path }, command: currentCommand })
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
      <PromptModal app={app} open={launchState.prompt} onClose={closeAll} onSubmit={onSubmit} />
    </>
  )
}
