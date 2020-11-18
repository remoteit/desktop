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
  DialogActions,
  Button,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import { UsernameModal } from '../../components/UsernameModal'

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
  const app = useApplication(service?.typeID)
  const [open, setOpen] = useState<boolean>(false)
  const [openPutty, setOpenPutty] = useState<boolean>(false)
  const closeAll = () => {
    setOpen(false)
    setOpenPutty(false)
    ui.set({ requireInstallPutty: false })
  }

  useEffect(() => {
    requireInstallPutty ? setOpenPutty(true) : closeAll()
  }, [requireInstallPutty])

  if (!connection || !connection.active || !app) return null

  const check = () => {
    if (!app.prompt || connection.username) launch()
    else setOpen(true)
  }
  const launch = (username?: string) => {
    closeAll()
    if (username)
      setConnection({
        ...connection,
        username: username.toString(),
      })
    const launchApp = app.launch({ ...connection, username: username || connection.username })
    launchBrowser(app.title) ? window.open(launchApp) : emit('service/launch', { command: launchApp, pathPutty })
  }

  const getPutty = () => {
    window.open('https://link.remote.it/download/putty')
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

      <UsernameModal connection={connection} open={open} onSubmit={launch} service={service} onClose={closeAll} />

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
