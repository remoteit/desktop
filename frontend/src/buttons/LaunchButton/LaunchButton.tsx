import React, { useState, useEffect } from 'react'
import heartbeat from '../../services/Heartbeat'
import { IconButton, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { updateConnection, launchDisabled } from '../../helpers/connectionHelper'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { Color, FontSize } from '../../styling'
import { Application } from '../../shared/applications'
import { PromptModal } from '../../components/PromptModal'
import { windowOpen } from '../../services/Browser'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'

type Props = {
  menuItem?: boolean
  size?: FontSize
  color?: Color
  type?: IconType
  app?: Application
  device?: IDevice
  connection?: IConnection
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onLaunch?: () => void
}

export const LaunchButton: React.FC<Props> = ({
  menuItem,
  onLaunch,
  onMouseEnter,
  onMouseLeave,
  connection,
  device,
  app,
  ...props
}) => {
  const dispatch = useDispatch<Dispatch>()
  const [prompt, setPrompt] = useState<boolean>(false)
  const ready = connection?.connectLink || connection?.ready
  const loading = !ready || connection?.starting || (device && !device?.loaded)
  const disabled = launchDisabled(connection) || loading
  const autoLaunch = useSelector((state: ApplicationState) => state.ui.autoLaunch && connection?.autoLaunch)

  useEffect(() => {
    if (autoLaunch && !launchDisabled(connection) && ready) {
      dispatch.ui.set({ autoLaunch: false })
      clickHandler()
    }
  }, [autoLaunch, connection])

  if (!app) return null

  const clickHandler = async () => {
    if (device && !device.loaded) {
      await dispatch.devices.fetchSingleFull({ id: device.id, hidden: true })
      dispatch.ui.set({ autoLaunch: true })
      return
    }
    if (app.prompt) setPrompt(true)
    else launch()
    onLaunch?.()
  }

  const close = () => setPrompt(false)

  const onSubmit = (tokens: ILookup<string>) => {
    if (!app.connection) return
    updateConnection(app, { ...app.connection, ...tokens })
    launch()
    close()
  }

  const launch = () => {
    if (app.launchType === 'URL') windowOpen(app.string, '_blank')
    else emit('launch/app', app.displayString, !(app.tokens.includes('path') || app.tokens.includes('app')))
    heartbeat.connect()
  }

  const LaunchIcon = <Icon {...props} name={loading ? 'spinner-third' : 'launch'} spin={loading} fixedWidth />

  return (
    <>
      {menuItem ? (
        <MenuItem dense onClick={clickHandler} disabled={disabled}>
          <ListItemIcon>{LaunchIcon}</ListItemIcon>
          <ListItemText primary={app.contextTitle} />
        </MenuItem>
      ) : (
        <IconButton onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={clickHandler} disabled={disabled}>
          {LaunchIcon}
        </IconButton>
      )}
      <PromptModal app={app} open={prompt} onClose={close} onSubmit={onSubmit} />
    </>
  )
}
