import React, { useState, useEffect } from 'react'
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

type Props = {
  connection?: IConnection
  service?: IService
}

export const LaunchButton: React.FC<Props> = ({ connection, service }) => {
  const { requireInstallPutty } = useSelector((state: ApplicationState) => ({
    requireInstallPutty: state.ui.requireInstallPutty
  }))
  const css = useStyles()
  const app = useApplication(service && service.typeID)
  const [open, setOpen] = useState<boolean>(false)
  const [username, setUsername] = useState<string>((connection && connection.username) || '')
  const [openModalRequierePutty, setOpenModalRequierePutty] = useState<boolean>(false)

  useEffect(() => {
    setUsername(connection?.username || '')
  }, [connection?.username])

  if (!connection || !connection.active || !app) return null

  const close = () => setOpen(false)
  const closeModal = () => setOpenModalRequierePutty(false)
  const check = () => {
    if (!app.prompt || connection.username) launch()
    else setOpen(true)
  }
  const launch = () => {
    if (username)
      setConnection({
        ...connection,
        username: username.toString(),
      })
    const launchApp = app.launch({ ...connection, username })

    app.launchBrowser(app.title) ? window.open(launchApp) : emit('service/launch', launchApp)
    requireInstallPutty ? setOpenModalRequierePutty(true) : close()
    close()
  }

  const getPutty = () => {
    window.open('https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html')
    closeModal()
    close()
  }

  return (
    <>
      <Tooltip title={`Launch ${app.title}`}>
        <IconButton onClick={check}>
          <Icon className={app.iconRotate ? css.rotate : ''} name={app.icon} size="md" fixedWidth />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
        <form onSubmit={launch}>
          <Typography variant="h1">Enter a username to launch</Typography>
          <DialogContent>
            <Typography variant="h4">{app.launch({ ...connection, username })}</Typography>
            <TextField
              autoFocus
              variant="filled"
              label="Username"
              onChange={event => setUsername(event.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={close} color="primary" size="small" type="button">
              Cancel
            </Button>
            <Button variant="contained" color="primary" size="small" type="submit">
              Launch
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openModalRequierePutty} onClose={closeModal} maxWidth="xs" fullWidth>
          <Typography variant="h1">you should install Putty for open SSH</Typography>
          <DialogContent>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal} color="primary" size="small" type="button">
              Cancel
            </Button>
            <Button 
              onClick={getPutty}
              variant="contained" 
              color="primary" 
              size="small" 
              type="button">
              Get to download Putty
            </Button>
          </DialogActions>
      </Dialog>
    </>
  )
}

const useStyles = makeStyles({
  rotate: { transform: 'rotate(-45deg)' },
})
