import { Button, Dialog, DialogActions, DialogContent, TextField, Typography } from '@material-ui/core'
import React from 'react'
import useApplication from '../../shared/applications'

export const ModalSetUsername: React.FC<{
  connection?: IConnection
  openUsername: boolean
  handleSubmit: () => void
  username: string
  setUsername: React.Dispatch<React.SetStateAction<string>>
  service?: IService
  close: () => void
}> = ({ connection, openUsername, handleSubmit, username, setUsername, service, close }) => {
  const app = useApplication(service && service.typeID)
  if (!connection || !connection.active || !app) return null

  return (
    <Dialog open={openUsername} onClose={close} maxWidth="xs" fullWidth>
      <form
        onSubmit={event => {
          event.preventDefault()
          handleSubmit()
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
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
