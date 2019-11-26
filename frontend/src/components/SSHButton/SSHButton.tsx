import React, { useState } from 'react'
import { hostName } from '../../helpers/nameHelper'
import { IService } from 'remote.it'
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Button,
} from '@material-ui/core'
import { Icon } from '../Icon'

type Props = {
  connection?: IConnection
  service?: IService
}

const SSH_TYPE = 28

export const SSHButton: React.FC<Props> = ({ connection, service }) => {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')

  console.log('SERVICE', service)

  if (!connection || !connection.active) return null
  if (service && service.typeID !== SSH_TYPE) return null

  const url = `ssh://${username}@${hostName(connection)}`
  const close = () => setOpen(false)
  const launch = () => {
    window.open(url)
    close()
  }

  return (
    <>
      <Tooltip title="SSH">
        <IconButton onClick={() => setOpen(true)}>
          <Icon name="terminal" size="md" fixedWidth />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
        <form onSubmit={launch}>
          <DialogTitle>Enter Username</DialogTitle>
          <DialogContent>
            <DialogContentText>{url}</DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              variant="filled"
              label="Username"
              onChange={event => setUsername(event.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={close} color="primary" type="button">
              Cancel
            </Button>
            <Button variant="contained" color="primary">
              Launch
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}
