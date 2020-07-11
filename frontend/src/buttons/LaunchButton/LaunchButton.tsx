import React, { useState, useEffect } from 'react'
import { useApplication } from '../../shared/applications'
import { setConnection } from '../../helpers/connectionHelper'
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

type Props = {
  connection?: IConnection
  service?: IService
}

export const LaunchButton: React.FC<Props> = ({ connection, service }) => {
  const css = useStyles()
  const app = useApplication(service && service.typeID)
  const [open, setOpen] = useState<boolean>(false)
  const [username, setUsername] = useState<string>((connection && connection.username) || '')

  useEffect(() => {
      setUsername((connection && connection.username) || '')
  },[connection?.username])
  

  if (!connection || !connection.active || !app) return null

  const close = () => setOpen(false)
  const check = () => {
    if (!app.prompt || connection.username) launch()
    else setOpen(true)
  }
  const launch = () => {
    setConnection({
      ...connection,
      username: username.toString() || connection.username,
    })
    window.open(app.launch({ ...connection, username }))
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
    </>
  )
}

const useStyles = makeStyles({
  rotate: { transform: 'rotate(-45deg)' },
})
