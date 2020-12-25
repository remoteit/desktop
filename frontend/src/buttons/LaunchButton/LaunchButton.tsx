import React, { useState, useEffect } from 'react'
import { ApplicationState } from '../../store'
import { useApplication } from '../../shared/applications'
import { setConnection } from '../../helpers/connectionHelper'
import { launchPutty } from '../../services/Browser'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { PromptModal } from '../../components/PromptModal'
import { Dispatch } from '../../store'
import { FontSize } from '../../styling'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
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

type Props = {
  connection?: IConnection
  service?: IService
  menuItem?: boolean
  size?: FontSize
}

export const LaunchButton: React.FC<Props> = ({ connection, service, menuItem, size = 'md' }) => {
  const { requireInstallPutty, loading, pathPutty } = useSelector((state: ApplicationState) => ({
    requireInstallPutty: state.ui.requireInstallPutty,
    pathPutty: state.ui.pathPutty,
    loading: state.ui.loading,
  }))
  const { ui } = useDispatch<Dispatch>()
  const [launch, setLaunch] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const [openPutty, setOpenPutty] = useState<boolean>(false)
  const app = useApplication('launch', service, connection)
  const css = useStyles()

  useEffect(() => {
    if (launch) {
      app.prompt ? setOpen(true) : launchBrowser()
    }
    if (requireInstallPutty) {
      setOpenPutty(true)
      ui.set({ requireInstallPutty: false })
    }
  }, [requireInstallPutty, launch, app])

  if (!connection || !connection.active || !app) return null

  const launchBrowser = () => {
    try {
      launchPutty(service?.typeID)
        ? emit('service/launch', { command: app.command, pathPutty })
        : window.open(app.command)
    } catch (error) {
      ui.set({ errorMessage: `Could not launch ${app.command}. Invalid URL.` })
    }
    closeAll()
  }

  const onSubmit = (tokens: ILookup<string>) => {
    setConnection({ ...connection, ...tokens })
  }

  const getPutty = () => {
    window.open('https://link.remote.it/download/putty')
    closeAll()
  }

  const closeAll = () => {
    setLaunch(false)
    setOpen(false)
    setOpenPutty(false)
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
        <MenuItem dense onClick={() => setLaunch(true)}>
          <ListItemIcon>{LaunchIcon}</ListItemIcon>
          <ListItemText primary={`Launch ${app.title}`} />
        </MenuItem>
      ) : (
        <Tooltip title={`Launch ${app.title}`}>
          <IconButton onClick={() => setLaunch(true)} disabled={loading}>
            {LaunchIcon}
          </IconButton>
        </Tooltip>
      )}

      <PromptModal app={app} open={open} onClose={closeAll} onSubmit={onSubmit} />

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
