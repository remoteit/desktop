import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { useApplication } from '../../shared/applications'
import { setConnection } from '../../helpers/connectionHelper'
import { useSelector } from 'react-redux'
import {
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { makeStyles } from '@material-ui/core/styles'
import { emit } from '../../services/Controller'
import { ApplicationState } from '../../store'
import { launchBrowser } from '../../services/Browser'

type Props = {
  connection?: IConnection
  service?: IService
}

export const LaunchButton: React.FC<Props> = ({ connection, service }) => {
  const { requireInstallPutty, loading, pathPutty } = useSelector((state: ApplicationState) => ({
    requireInstallPutty: state.ui.requireInstallPutty,
    loading: state.ui.loading,
    pathPutty: state.ui.pathPutty,
  }))
  const css = useStyles()
  const { ui } = useDispatch<Dispatch>()
  const app = useApplication(service && service.typeID)
  const [open, setOpen] = useState<boolean>(false)
  const [username, setUsername] = useState<string>((connection && connection.username) || '')
  const [openModalRequierePutty, setOpenModalRequierePutty] = useState<boolean>(false)
  const close = () => setOpen(false)

  useEffect(() => {
    setUsername(connection?.username || '')
  }, [connection?.username])

  useEffect(() => {
    requireInstallPutty ? setOpenModalRequierePutty(true) : close()
  }, [requireInstallPutty])

  if (!connection || !connection.active || !app) return null

  const closeModal = () => {
    setOpenModalRequierePutty(false)
    ui.set({ requireInstallPutty: false })
  }
  const check = () => {
    if (!app.prompt || connection.username) launch()
    else setOpen(true)
  }
  const launch = () => {
    close()
    if (username)
      setConnection({
        ...connection,
        username: username.toString(),
      })
    const launchApp = app.launch({ ...connection, username })

    launchBrowser(app.title) ? window.open(launchApp) : emit('service/launch', {command: launchApp, pathPutty})
  }

  const getPutty = () => {
    window.open('https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html')
    closeModal()
    close()
  }

  return (
    <>
      <Tooltip title={`Launch ${app.title}`}>
        <IconButton onClick={check} disabled={loading}>
          <Icon
            className={app.iconRotate ? css.rotate : ''}
            name={loading ? 'spinner-third' : app.icon}
            spin={loading}
            size="md"
            fixedWidth
          />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
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
            <Button onClick={close} color="primary" size="small" type="button">
              Cancel
            </Button>
            <Button variant="contained" color="primary" size="small" type="submit">
              {loading ? 'Loading putty...' : 'Launch'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openModalRequierePutty} onClose={closeModal} maxWidth="xs" fullWidth>
        <Typography variant="h1">Please install Putty to launch SSH connections.</Typography>
        <DialogActions>
          <Button onClick={closeModal} color="primary" size="small" type="button">
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
