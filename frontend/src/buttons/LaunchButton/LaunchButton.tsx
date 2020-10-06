import React, { useState, useEffect } from 'react'
import { ApplicationState } from '../../store'
import { useApplication } from '../../shared/applications'
import { setConnection } from '../../helpers/connectionHelper'
import { launchBrowser } from '../../services/Browser'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { FontSize } from '../../styling'
import {
  makeStyles,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'

type Props = {
  connection?: IConnection
  service?: IService
  menuItem?: boolean
  size?: FontSize
}

export const LaunchButton: React.FC<Props> = ({ connection, service, menuItem, size = 'md' }) => {
  const { requireInstallPutty, loading, pathPutty } = useSelector((state: ApplicationState) => ({
    requireInstallPutty: state.ui.requireInstallPutty,
    loading: state.ui.loading,
    pathPutty: state.ui.pathPutty,
  }))
  const css = useStyles()
  const { ui } = useDispatch<Dispatch>()
  const app = useApplication(service && service.typeID)
  const [openUsername, setOpenUsername] = useState<boolean>(false)
  const [username, setUsername] = useState<string>((connection && connection.username) || '')
  const [openPutty, setOpenPutty] = useState<boolean>(false)
  const closeAll = () => {
    setOpenUsername(false)
    setOpenPutty(false)
    ui.set({ requireInstallPutty: false })
  }

  useEffect(() => {
    setUsername(connection?.username || '')
  }, [connection?.username])

  useEffect(() => {
    requireInstallPutty ? setOpenPutty(true) : closeAll()
  }, [requireInstallPutty])

  if (!connection || !connection.active || !app) return null

  const check = () => {
    if (!app.prompt || connection.username) launch()
    else setOpenUsername(true)
  }
  const launch = () => {
    closeAll()
    if (username)
      setConnection({
        ...connection,
        username: username.toString(),
      })
    const launchApp = app.launch({ ...connection, username })

    launchBrowser(app.title) ? window.open(launchApp) : emit('service/launch', { command: launchApp, pathPutty })
  }

  const getPutty = () => {
    window.open('https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html')
    closeAll()
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
        <MenuItem dense onClick={check}>
          <ListItemIcon>{LaunchIcon}</ListItemIcon>
          <ListItemText primary={`Launch ${app.title}`} />
        </MenuItem>
      ) : (
        <Tooltip title={`Launch ${app.title}`}>
          <IconButton onClick={check} disabled={loading}>
            {LaunchIcon}
          </IconButton>
        </Tooltip>
      )}

      <Dialog open={openUsername} onClose={closeAll} maxWidth="xs" fullWidth>
        <form
          onSubmit={event => {
            event.preventDefault()
            launch()
          }}
        >
          <Typography variant="h1">Enter a username to launch</Typography>
          <DialogContent>
            <Typography variant="h4">{app.launch({ ...connection, username })}</Typography>
            <TextField
              autoFocus
              variant="filled"
              label="Username"
              onChange={event => {
                setUsername(event.target.value)
                event.stopPropagation()
              }}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeAll} color="primary" size="small" type="button">
              Cancel
            </Button>
            <Button variant="contained" color="primary" size="small" type="submit">
              {loading ? 'Loading putty...' : 'Launch'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openPutty} onClose={closeAll} maxWidth="xs" fullWidth>
        <Typography variant="h1">Please install Putty to launch SSH connections.</Typography>
        <DialogActions>
          <Button onClick={closeAll} color="primary" size="small" type="button">
            Cancel
          </Button>
          <Button onClick={getPutty} variant="contained" color="primary" size="small" type="button">
            Download Putty
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const useStyles = makeStyles({
  rotate: { transform: 'rotate(-45deg)' },
})
