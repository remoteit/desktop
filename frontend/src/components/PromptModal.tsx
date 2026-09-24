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
  const [tokens, setTokens] = useState<ILookup<string>>({})
  const [error, setError] = useState<string>()
  // Derived each render, not seeded into state on open: the host can arrive while open, and a seeded empty entry
  // blocked Save and would have blanked the host on submit
  const missing: ILookup<string> = Object.fromEntries(
    app.missingTokens.map(token => [token, typeof tokens[token] === 'string' ? tokens[token] : ''])
  )

  useEffect(() => {
    setTokens({})
    setError(undefined)
  }, [open])

  const update = (token: string, value: string) => setTokens({ ...tokens, [token]: value })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form
        onSubmit={event => {
          event.preventDefault()
          const empty = Object.keys(missing).find(key => !missing[key])
          if (empty) setError(empty)
          else onSubmit(missing)
        }}
      >
        <DialogTitle>{t('promptModal.title', 'Missing info found')}</DialogTitle>
        <DialogContent>
          <Typography variant="h4">{app.preview(missing)}</Typography>
          <List dense>
            {Object.keys(missing).map((token, index) =>
              isFileToken(token) && browser.hasBackend ? (
                <InlineFileFieldSetting
                  key={token}
                  token={token}
                  disableGutters
                  label={t('promptModal.applicationPath', 'Application path')}
                  value={missing[token]}
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
                    value={missing[token]}
                    error={token === error}
                    onChange={event => update(token, event.target.value)}
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
