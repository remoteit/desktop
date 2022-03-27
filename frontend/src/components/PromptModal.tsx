import {
  List,
  ListItem,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@material-ui/core'
import React, { useState, useEffect } from 'react'
import { InlineFileFieldSetting } from './InlineFileFieldSetting'
import { Application } from '../shared/applications'

type Props = {
  app: Application
  open: boolean
  onClose: () => void
  onSubmit: (tokens: ILookup<string>) => void
}

export const PromptModal: React.FC<Props> = ({ app, open, onSubmit, onClose }) => {
  const toLookup = () => app.missingTokens.reduce((obj, item) => ({ ...obj, [item]: '' }), {})
  const [tokens, setTokens] = useState<ILookup<string>>(toLookup())
  const [error, setError] = useState<string>()

  useEffect(() => {
    setTokens(toLookup())
  }, [open])

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <form
          onSubmit={event => {
            let foundError = false
            Object.keys(tokens).forEach(key => {
              if (!tokens[key]) {
                setError(key)
                foundError = true
              }
            })
            event.preventDefault()
            if (!foundError) onSubmit(tokens)
          }}
        >
          <DialogTitle>Missing info found</DialogTitle>
          <DialogContent>
            <Typography variant="h4">{app.preview(tokens)}</Typography>
            <List dense>
              {app.missingTokens.map((token, index) =>
                token === 'path' ? (
                  <InlineFileFieldSetting
                    key={token}
                    disableGutters
                    label="Application path"
                    value={app.value(token)}
                    variant="filled"
                    onSave={value => {
                      if (value) {
                        setTokens({ ...tokens, path: value })
                      } else {
                        delete tokens.path
                        setTokens({ ...tokens })
                      }
                    }}
                  />
                ) : (
                  <ListItem key={token} disableGutters>
                    <TextField
                      fullWidth
                      autoFocus={index === 0}
                      variant="filled"
                      label={token}
                      value={tokens[token]}
                      error={token === error}
                      onChange={event => setTokens({ ...tokens, [token]: event.target.value })}
                    />
                  </ListItem>
                )
              )}
            </List>
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
