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
} from '@mui/material'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { InlineFileFieldSetting } from './InlineFileFieldSetting'
import { isFileToken } from '../helpers/connectionHelper'
import { Application } from '@common/applications'
import browser from '../services/browser'

type Props = {
  app: Application
  open: boolean
  onClose: () => void
  onSubmit: (tokens: ILookup<string>) => void
}

export const PromptModal: React.FC<Props> = ({ app, open, onSubmit, onClose }) => {
  const { t } = useTranslation()
  const toLookup = () => app.missingTokens.reduce((obj, item) => ({ ...obj, [item]: '' }), {})
  const [tokens, setTokens] = useState<ILookup<string>>(toLookup())
  const [error, setError] = useState<string>()

  useEffect(() => {
    setTokens(toLookup())
  }, [open])

  const update = (token: string, value: string) => {
    let updated: ILookup<string> = { ...tokens, [token]: value }
    if (!value) delete updated[token]
    setTokens(updated)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form
        onSubmit={event => {
          event.preventDefault()
          let foundError = false
          Object.keys(tokens).forEach(key => {
            if (!tokens[key]) {
              setError(key)
              foundError = true
            }
          })
          if (!foundError) onSubmit(tokens)
        }}
      >
        <DialogTitle>{t('promptModal.title', 'Missing info found')}</DialogTitle>
        <DialogContent>
          <Typography variant="h4">{app.preview(tokens)}</Typography>
          <List dense>
            {app.missingTokens.map((token, index) =>
              isFileToken(token) && browser.hasBackend ? (
                <InlineFileFieldSetting
                  key={token}
                  token={token}
                  disableGutters
                  label={t('promptModal.applicationPath', 'Application path')}
                  value={app.value(token)}
                  variant="filled"
                  onSave={value => update(token, value || '')}
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
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="contained" color="primary" type="submit">
            {t('common.save', 'Save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
