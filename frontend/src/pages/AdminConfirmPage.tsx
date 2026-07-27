import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useHistory } from 'react-router-dom'
import { Typography, Box, TextField, Button, CircularProgress } from '@mui/material'
import { Container } from '../components/Container'
import { Icon } from '../components/Icon'
import { Notice } from '../components/Notice'
import { graphQLConfirmAdminPromotion } from '../services/graphQLMutation'

export const AdminConfirmPage: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const history = useHistory()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'manual'>('loading')
  const [manualCode, setManualCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Extract token from URL query params
  const params = new URLSearchParams(location.search)
  const token = params.get('token')

  useEffect(() => {
    if (token) {
      confirmWithToken(token)
    } else {
      setStatus('manual')
    }
  }, [token])

  const confirmWithToken = async (token: string) => {
    setStatus('loading')
    try {
      const result = await graphQLConfirmAdminPromotion(token)
      if (result !== 'ERROR') {
        setStatus('success')
        window.dispatchEvent(new Event('refreshAdminData'))
      } else {
        setErrorMessage(t('adminConfirmPage.linkInvalid', 'The confirmation link is invalid or has expired.'))
        setStatus('error')
      }
    } catch (error) {
      setErrorMessage(t('adminConfirmPage.linkInvalid', 'The confirmation link is invalid or has expired.'))
      setStatus('error')
    }
  }

  const handleManualSubmit = async () => {
    if (!manualCode.trim() || manualCode.trim().length !== 6) {
      setErrorMessage(t('adminConfirmPage.invalidCodeLength', 'Please enter a valid 6-digit code.'))
      return
    }
    setSubmitting(true)
    setErrorMessage('')
    try {
      const result = await graphQLConfirmAdminPromotion(undefined, manualCode.trim())
      if (result !== 'ERROR') {
        setStatus('success')
        window.dispatchEvent(new Event('refreshAdminData'))
      } else {
        setErrorMessage(t('adminConfirmPage.invalidCodeRetry', 'Invalid or expired code. Please try again.'))
      }
    } catch (error) {
      setErrorMessage(t('adminConfirmPage.invalidCodeRetry', 'Invalid or expired code. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleManualSubmit()
    }
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Typography variant="h2" sx={{ padding: 2 }}>
          {t('adminConfirmPage.title', 'Admin Promotion Confirmation')}
        </Typography>
      }
    >
      <Box sx={{ padding: 3, maxWidth: 500, margin: '0 auto' }}>
        {status === 'loading' && (
          <Box sx={{ textAlign: 'center', padding: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ marginTop: 2 }}>
              {t('adminConfirmPage.confirmingPromotion', 'Confirming admin promotion...')}
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box sx={{ textAlign: 'center', padding: 4 }}>
            <Icon name="check-circle" size="xxl" color="success" />
            <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
              {t('adminConfirmPage.confirmedTitle', 'Admin Promotion Confirmed')}
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              {t('adminConfirmPage.confirmedMessage', 'The user has been successfully promoted to admin.')}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => history.push('/admin/admins')}
              sx={{ marginTop: 2 }}
            >
              {t('adminConfirmPage.backToAdmins', 'Back to Admins')}
            </Button>
          </Box>
        )}

        {status === 'error' && (
          <Box sx={{ textAlign: 'center', padding: 4 }}>
            <Icon name="exclamation-triangle" size="xxl" color="warning" />
            <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
              {t('adminConfirmPage.confirmationFailed', 'Confirmation Failed')}
            </Typography>
            <Notice severity="error" gutterBottom fullWidth>
              {errorMessage}
            </Notice>
            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ marginTop: 2 }}>
              {t('adminConfirmPage.manualCodeHint', 'You can try entering the 6-digit code from your email manually:')}
            </Typography>
            <TextField
              fullWidth
              placeholder={t('adminConfirmPage.enterCode', 'Enter code')}
              value={manualCode}
              onChange={e => setManualCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6))}
              onKeyDown={handleKeyDown}
              inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' } }}
              sx={{ marginTop: 1, marginBottom: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleManualSubmit}
              disabled={submitting || manualCode.length !== 6}
              fullWidth
            >
              {submitting
                ? t('common.confirmingEllipsis', 'Confirming...')
                : t('adminConfirmPage.confirmWithCode', 'Confirm with Code')}
            </Button>
          </Box>
        )}

        {status === 'manual' && (
          <Box sx={{ textAlign: 'center', padding: 4 }}>
            <Icon name="shield" size="xxl" color="primary" />
            <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
              {t('adminConfirmPage.enterCodeTitle', 'Enter Confirmation Code')}
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              {t(
                'adminConfirmPage.enterCodeDescription',
                'Enter the 6-digit code from the confirmation email sent to your inbox.'
              )}
            </Typography>
            {errorMessage && (
              <Notice severity="error" gutterBottom fullWidth>
                {errorMessage}
              </Notice>
            )}
            <TextField
              fullWidth
              placeholder={t('adminConfirmPage.enterCode', 'Enter code')}
              value={manualCode}
              onChange={e => setManualCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6))}
              onKeyDown={handleKeyDown}
              inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' } }}
              sx={{ marginTop: 2, marginBottom: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleManualSubmit}
              disabled={submitting || manualCode.length !== 6}
              fullWidth
            >
              {submitting
                ? t('common.confirmingEllipsis', 'Confirming...')
                : t('adminConfirmPage.confirmAdminPromotion', 'Confirm Admin Promotion')}
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  )
}
