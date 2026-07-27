import React, { useState, useEffect } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'

type Props = {
  open: boolean
  currentEmail: string
  onSubmit: (newEmail: string) => Promise<void>
  onClose: () => void
}

export const ChangeEmailDialog: React.FC<Props> = ({ open, currentEmail, onSubmit, onClose }) => {
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setNewEmail('')
      setError(undefined)
      setLoading(false)
    }
  }, [open])

  const validateEmail = (email: string): boolean => {
    // RFC 5322 compliant email validation - allows +, -, _, and other valid characters
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Validate email
    if (!newEmail.trim()) {
      setError('Email is required')
      return
    }

    if (!validateEmail(newEmail)) {
      setError('Invalid email format')
      return
    }

    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setError('New email must be different from current email')
      return
    }

    setError(undefined)
    setLoading(true)

    try {
      await onSubmit(newEmail)
      onClose()
    } catch (err) {
      setError('Failed to update email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Change User Email</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Current email: <strong>{currentEmail}</strong>
          </Typography>
          <TextField
            fullWidth
            autoFocus
            margin="normal"
            label="New Email Address"
            type="email"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value)
              setError(undefined)
            }}
            error={!!error}
            helperText={error}
            disabled={loading}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Email'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
