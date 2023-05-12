import React from 'react'
import heartbeat from '../../services/Heartbeat'
import { IconButton, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { setConnection, launchDisabled } from '../../helpers/connectionHelper'
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
  app,
  ...props
}) => {
  const { ui } = useDispatch<Dispatch>()
  const [prompt, setPrompt] = React.useState<boolean>(false)
  const ready = connection?.connectLink || connection?.ready
  const loading = !ready || connection?.starting
  const disabled = launchDisabled(connection) || loading
  const autoLaunch = useSelector((state: ApplicationState) => state.ui.autoLaunch && connection?.autoLaunch)

  React.useEffect(() => {
    if (autoLaunch && !launchDisabled(connection) && ready) {
      ui.set({ autoLaunch: false })
      clickHandler()
    }
  }, [autoLaunch, connection])

  if (!app) return null

  const clickHandler = () => {
    if (app.prompt) setPrompt(true)
    else launch()
    onLaunch?.()
  }

  const close = () => setPrompt(false)

  const onSubmit = (tokens: ILookup<string>) => {
    if (!app.connection) return
    const newConnection = { ...app.connection, ...tokens }
    setConnection(newConnection)
    app.connection = newConnection
    launch()
    close()
  }

  const launch = () => {
    if (app.launchType === 'URL') windowOpen(app.string, '_blank')
    else emit('launch/app', app.string, !(app.tokens.includes('path') || app.tokens.includes('app')))
    heartbeat.connect()
  }

  const LaunchIcon = (
    <Icon
      {...props}
      name={connection?.error ? 'hyphen' : loading ? 'spinner-third' : 'launch'}
      spin={loading}
      fixedWidth
    />
  )

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
