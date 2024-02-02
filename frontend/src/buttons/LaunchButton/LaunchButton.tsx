import React, { useState, useEffect } from 'react'
import heartbeat from '../../services/Heartbeat'
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { updateConnection, launchDisabled } from '../../helpers/connectionHelper'
import { State, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, ButtonProps } from '../../buttons/IconButton'
import { Color, Sizes } from '../../styling'
import { Application } from '@common/applications'
import { PromptModal } from '../../components/PromptModal'
import { windowOpen } from '../../services/Browser'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'

type Props = {
  menuItem?: boolean
  size?: Sizes
  color?: Color
  type?: IconType
  app?: Application
  connection?: IConnection
  iconButtonProps?: ButtonProps
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onLaunch?: () => void
}

export const LaunchButton: React.FC<Props> = ({
  menuItem,
  onLaunch,
  onMouseEnter,
  onMouseLeave,
  iconButtonProps,
  connection,
  app,
  ...props
}) => {
  const dispatch = useDispatch<Dispatch>()
  const [prompt, setPrompt] = useState<boolean>(false)
  const ready = connection?.connectLink || connection?.ready
  const loading = !ready || connection?.starting || (app?.service && !app.service.loaded)
  const disabled = launchDisabled(connection) || loading
  const autoLaunch = useSelector((state: State) => state.ui.autoLaunch && connection?.autoLaunch)

  useEffect(() => {
    if (autoLaunch && !launchDisabled(connection) && ready) {
      dispatch.ui.set({ autoLaunch: false })
      clickHandler()
    }
  }, [autoLaunch, connection])

  if (!app) return null

  const clickHandler = async () => {
    if (app.service && !app.service.loaded) {
      await dispatch.devices.fetchSingleFull({ id: app.service.deviceID, hidden: true })
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
    if (app.launchType === 'URL') windowOpen(app.string, '_blank', !app.string.startsWith('http'))
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
        <IconButton
          {...iconButtonProps}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={clickHandler}
          disabled={disabled}
        >
          {LaunchIcon}
        </IconButton>
      )}
      <PromptModal app={app} open={prompt} onClose={close} onSubmit={onSubmit} />
    </>
  )
}
