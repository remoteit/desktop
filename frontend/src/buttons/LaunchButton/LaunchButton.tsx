import React from 'react'
import { MenuItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { safeWindowOpen } from '../../services/Browser'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
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
  const app = useApplication(service, connection)
  const [prompt, setPrompt] = React.useState<boolean>(false)
  const disabled = !connection?.enabled || connection.connecting || !connection.host
  const autoLaunch = useSelector((state: ApplicationState) => state.ui.autoLaunch)

  React.useEffect(() => {
    if (autoLaunch && app.connection?.enabled && app.connection?.host) {
      ui.set({ autoLaunch: false })
      clickHandler()
    }
  }, [autoLaunch, app.connection])

  if (!app || !connection?.enabled) return null

  const clickHandler = () => {
    if (app.prompt) setPrompt(true)
    else launch()
    onLaunch && onLaunch()
  }

  const close = () => setPrompt(false)

  const onSubmit = (tokens: ILookup<string>) => {
    const newConnection = { ...connection, ...tokens }
    connection && setConnection(newConnection)
    app.connection = newConnection
    launch()
    close()
  }

  const launch = () => {
    if (app.launchType === LAUNCH_TYPE.URL) safeWindowOpen(app.string)
    else emit('launch/app', app.string)
  }

  const LaunchIcon = <Icon name="launch" size={props.size} color={props.color} type={props.type} fixedWidth />

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
        <IconButton {...props} onClick={clickHandler} disabled={disabled} icon="launch" />
      )}
      <PromptModal app={app} open={prompt} onClose={close} onSubmit={onSubmit} />
    </>
  )
}
