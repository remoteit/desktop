import { Button, Dialog, DialogActions, DialogContent, TextField, Typography } from '@material-ui/core'
import React, { useState, useEffect } from 'react'
import useApplication from '../../shared/applications'

export const UsernameModal: React.FC<{
  connection?: IConnection
  open: boolean
  service?: IService
  onSubmit: (username: string) => void
  onClose: () => void
}> = ({ connection, open, onSubmit, service, onClose }) => {
  const app = useApplication(service && service.typeID)
  const [username, setUsername] = useState<string>((connection?.username) || '')

  useEffect(() => {
    setUsername(connection?.username || '')
  }, [connection?.username])

  if (!connection || !connection.active || !app) return null

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <form
          onSubmit={event => {
            event.preventDefault()
            onSubmit(username)
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
            <Button onClick={onClose} color="primary" size="small" type="button">
              Cancel
            </Button>
            <Button variant="contained" color="primary" size="small" type="submit">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}
