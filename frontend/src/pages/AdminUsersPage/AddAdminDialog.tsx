import React, { useState, useEffect } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
} from '@mui/material'
import { Notice } from '../../components/Notice'
import { Icon } from '../../components/Icon'
import { graphQLAdminUsers } from '../../services/graphQLRequest'
import { graphQLRequestAdminPromotion, graphQLConfirmAdminPromotion } from '../../services/graphQLMutation'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 'search' | 'confirm' | 'done'

export const AddAdminDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>('search')
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string>()
  const [confirmCode, setConfirmCode] = useState('')
  const [foundUser, setFoundUser] = useState<{ id: string; email: string; admin: boolean } | null>(null)

  useEffect(() => {
    if (open) {
      setStep('search')
      setEmail('')
      setError(undefined)
      setFoundUser(null)
      setSearching(false)
      setPromoting(false)
      setConfirming(false)
      setConfirmCode('')
    }
  }, [open])

  const handleSearch = async () => {
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    setError(undefined)
    setFoundUser(null)
    setSearching(true)

    try {
      const result = await graphQLAdminUsers({ from: 0, size: 1 }, { email: email.trim() })
      if (result === 'ERROR') throw new Error('Search failed')
      const users = result?.data?.data?.admin?.users?.items
      if (users && users.length > 0) {
        setFoundUser(users[0])
      } else {
        setError('No user found with that email address')
      }
    } catch (err) {
      setError('Failed to search for user')
    } finally {
      setSearching(false)
    }
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearch()
    }
  }

  const handlePromote = async () => {
    if (!foundUser) return

    setError(undefined)
    setPromoting(true)

    try {
      const result = await graphQLRequestAdminPromotion(foundUser.id)
      if (result !== 'ERROR') {
        setStep('confirm')
      } else {
        setError('Failed to request admin promotion.')
      }
    } catch (err) {
      setError('Failed to request admin promotion.')
    } finally {
      setPromoting(false)
    }
  }

  const handleConfirmCode = async () => {
    if (!confirmCode.trim()) {
      setError('Please enter the 6-digit code')
      return
    }

    setError(undefined)
    setConfirming(true)

    try {
      const result = await graphQLConfirmAdminPromotion(undefined, confirmCode.trim())
      if (result !== 'ERROR') {
        setStep('done')
        onSuccess()
      } else {
        setError('Invalid or expired code. Please try again.')
      }
    } catch (err) {
      setError('Failed to confirm admin promotion.')
    } finally {
      setConfirming(false)
    }
  }

  const handleCodeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleConfirmCode()
    }
  }

  const renderSearch = () => (
    <>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Search for a user by email to promote them to admin.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', marginTop: 2 }}>
        <TextField
          fullWidth
          autoFocus
          label="Email Address"
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value)
            setError(undefined)
            setFoundUser(null)
          }}
          onKeyDown={handleSearchKeyDown}
          error={!!error && !foundUser}
          helperText={!foundUser ? error : undefined}
          disabled={searching || promoting}
        />
        <Button variant="outlined" onClick={handleSearch} disabled={searching || promoting || !email.trim()}>
          {searching ? <CircularProgress size={20} /> : 'Search'}
        </Button>
      </Box>

      {foundUser && (
        <Box sx={{ marginTop: 2 }}>
          <List dense disablePadding>
            <ListItem>
              <Icon name="user" size="md" color="grayDark" fixedWidth inlineLeft />
              <ListItemText primary={foundUser.email} secondary={foundUser.id} />
            </ListItem>
          </List>

          {foundUser.admin ? (
            <Notice severity="warning" fullWidth sx={{ marginTop: 1 }}>
              This user is already an admin.
            </Notice>
          ) : (
            <>
              <Notice severity="info" fullWidth sx={{ marginTop: 1 }}>
                A confirmation email will be sent to your admin email address. You must click the link or enter the
                code to complete the promotion.
              </Notice>
              {error && (
                <Notice severity="error" fullWidth sx={{ marginTop: 1 }}>
                  {error}
                </Notice>
              )}
            </>
          )}
        </Box>
      )}
    </>
  )

  const renderConfirm = () => (
    <>
      <Notice severity="success" fullWidth>
        Confirmation email sent! Check your inbox for the code.
      </Notice>
      <Typography variant="body2" color="textSecondary" sx={{ marginTop: 2 }}>
        Promoting <strong>{foundUser?.email}</strong> to admin.
        Enter the 6-digit code from the email, or click the link in the email to confirm.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
        <TextField
          autoFocus
          label="Confirmation Code"
          value={confirmCode}
          onChange={e => {
            const val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6)
            setConfirmCode(val)
            setError(undefined)
          }}
          onKeyDown={handleCodeKeyDown}
          disabled={confirming}
          inputProps={{
            maxLength: 6,
            style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' },
          }}
          sx={{ width: 250 }}
        />
      </Box>
      {error && (
        <Notice severity="error" fullWidth sx={{ marginTop: 2 }}>
          {error}
        </Notice>
      )}
    </>
  )

  const renderDone = () => (
    <Box sx={{ textAlign: 'center', paddingY: 2 }}>
      <Icon name="check-circle" size="xxl" color="success" />
      <Typography variant="h2" sx={{ marginTop: 2 }}>
        Admin Added
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
        <strong>{foundUser?.email}</strong> is now an admin.
      </Typography>
    </Box>
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {step === 'search' && 'Add Admin'}
        {step === 'confirm' && 'Confirm Admin Promotion'}
        {step === 'done' && 'Admin Added'}
      </DialogTitle>
      <DialogContent>
        {step === 'search' && renderSearch()}
        {step === 'confirm' && renderConfirm()}
        {step === 'done' && renderDone()}
      </DialogContent>
      <DialogActions>
        {step === 'search' && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            {foundUser && !foundUser.admin && (
              <Button variant="contained" color="primary" onClick={handlePromote} disabled={promoting}>
                {promoting ? 'Sending...' : 'Send Promotion Request'}
              </Button>
            )}
          </>
        )}
        {step === 'confirm' && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmCode}
              disabled={confirming || confirmCode.length < 6}
            >
              {confirming ? 'Confirming...' : 'Confirm'}
            </Button>
          </>
        )}
        {step === 'done' && <Button onClick={onClose}>Close</Button>}
      </DialogActions>
    </Dialog>
  )
}
