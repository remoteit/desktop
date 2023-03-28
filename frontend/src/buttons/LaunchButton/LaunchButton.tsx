import React from 'react'
import heartbeat from '../../services/Heartbeat'
import { IconButton, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { windowOpen } from '../../services/Browser'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { Application } from '../../shared/applications'
import { setConnection, launchDisabled } from '../../helpers/connectionHelper'
import { PromptModal } from '../../components/PromptModal'
import { DataButton } from '../DataButton'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import { Color, FontSize } from '../../styling'

type Props = {
  menuItem?: boolean
  dataButton?: boolean
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
  dataButton,
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
  const disabled = !connection?.enabled || loading || !ready
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

  const LaunchIcon = <Icon {...props} name={loading ? 'spinner-third' : 'launch'} spin={loading} fixedWidth />

  return (
    <>
      {menuItem ? (
        <MenuItem dense onClick={clickHandler} disabled={disabled}>
          <ListItemIcon>{LaunchIcon}</ListItemIcon>
          <ListItemText primary={app.contextTitle} />
        </MenuItem>
      ) : dataButton ? (
        <DataButton
          value={app.string}
          label={app.contextTitle}
          title={app.contextTitle}
          icon={LaunchIcon}
          onClick={clickHandler}
        />
      ) : (
        <IconButton onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={clickHandler} disabled={disabled}>
          {LaunchIcon}
        </IconButton>
      )}
      <PromptModal app={app} open={prompt} onClose={close} onSubmit={onSubmit} />
    </>
  )
}
