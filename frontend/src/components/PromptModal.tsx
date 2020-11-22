import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@material-ui/core'
import React, { useState, useEffect } from 'react'
import { Application } from '../shared/applications'

export const PromptModal: React.FC<{
  app: Application
  open: boolean
  onClose: () => void
  onSubmit: (tokens: ILookup<string>) => void
}> = ({ app, open, onSubmit, onClose }) => {
  const [tokens, setTokens] = useState<ILookup<string>>(app.data)

  useEffect(() => {
    setTokens(app.data)
  }, [app])

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <form
          onSubmit={event => {
            event.preventDefault()
            onSubmit(tokens)
          }}
        >
          <DialogTitle>Missing data detected</DialogTitle>
          <DialogContent>
            <Typography variant="h4">{app.command}</Typography>
            {Object.keys(tokens).map(token => (
              <TextField
                fullWidth
                variant="filled"
                label={token}
                onChange={event => {
                  // event.stopPropagation()
                  setTokens({ ...tokens, [token]: event.target.value })
                }}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color="primary" type="button">
              Cancel
            </Button>
            <Button variant="contained" color="primary" type="submit">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}
