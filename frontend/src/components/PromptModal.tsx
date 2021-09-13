import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@material-ui/core'
import React, { useState, useEffect } from 'react'
import { Application } from '../shared/applications'

export const PromptModal: React.FC<{
  app: Application
  open: boolean
  onClose: () => void
  onSubmit: (tokens: ILookup<string>) => void
}> = ({ app, open, onSubmit, onClose }) => {
  const toLookup = () => app.missingTokens.reduce((obj, item) => ({ ...obj, [item]: '' }), {})
  const [tokens, setTokens] = useState<ILookup<string>>(toLookup())
  const [error, setError] = useState<string>()

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <form
          onSubmit={event => {
            let error = false
            Object.keys(tokens).forEach(key => {
              if (!tokens[key]) {
                setError(key)
                error = true
              }
            })
            event.preventDefault()
            if (!error) onSubmit(tokens)
          }}
        >
          <DialogTitle>Missing info found</DialogTitle>
          <DialogContent>
            <Typography variant="h4">{app.preview(tokens)}</Typography>
            {app.missingTokens.map((token, index) => (
              <TextField
                fullWidth
                autoFocus={index === 0}
                key={token}
                variant="filled"
                label={token}
                value={tokens[token]}
                error={token === error}
                onChange={event => setTokens({ ...tokens, [token]: event.target.value })}
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
