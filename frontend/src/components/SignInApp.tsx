import React, { useEffect } from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { OidcErrorCode } from '../services/oidc'
import browser from '../services/browser'
import brand from '@common/brand/config'

/**
 * The sign-in panel is a LAUNCHER now: the whole journey — email-first with org SSO
 * routing, password + MFA, Google, signup, forgot — lives at the authorization server
 * in the SYSTEM browser (permitteer docs/remoteit-desktop-login.md). The backend owns
 * the flow; this panel starts it and waits.
 */

/* What a failed sign-in tells the person to DO. Keyed by the reason rather than by the
   server's wording, because the two things a stuck user needs — "is this me or them?"
   and "do I retry or wait?" — are not in an error_description. The raw detail is shown
   underneath, quietly, so a support conversation still has something to go on. */
const SignInError: React.FC<{ code?: OidcErrorCode; detail?: string; retryAfter?: number }> = ({
  code,
  detail,
  retryAfter,
}) => {
  const { t } = useTranslation()
  // Round UP: telling someone to wait 6 minutes when the lock lifts in 6:40 just earns
  // a second failure. Below a minute still reads as "a minute".
  const minutes = Math.max(1, Math.ceil((retryAfter || 0) / 60))

  const message = (): string => {
    switch (code) {
      case 'rateLimited':
        return retryAfter
          ? t('signIn.errorRateLimitedWait', {
              count: minutes,
              defaultValue_one: 'Too many sign-in attempts from this network. Please try again in about a minute.',
              defaultValue_other:
                'Too many sign-in attempts from this network. Please try again in about {{count}} minutes.',
            })
          : t(
              'signIn.errorRateLimited',
              'Too many sign-in attempts from this network. Please wait a few minutes and try again.'
            )
      case 'unreachable':
        return t(
          'signIn.errorUnreachable',
          "We couldn't reach the sign-in service. Check your internet connection, then try again."
        )
      case 'unavailable':
        return t(
          'signIn.errorUnavailable',
          'The sign-in service is temporarily unavailable. Please try again in a few minutes.'
        )
      case 'refused':
        return t(
          'signIn.errorRefused',
          'The sign-in service refused this request. Try again, and contact support if it keeps happening.'
        )
      case 'expired':
        return t('signIn.errorExpired', 'That sign-in attempt expired before it finished. Please try again.')
      default:
        return t('signIn.errorUnknown', "Sign in didn't complete. Please try again.")
    }
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={0.5} maxWidth={420}>
      <Typography variant="body2" color="error" textAlign="center">
        {message()}
      </Typography>
      {!!detail && (
        <Typography variant="caption" color="grayDark.main" textAlign="center">
          {detail}
        </Typography>
      )}
    </Box>
  )
}

export function SignInApp() {
  const { t } = useTranslation()
  const { signInError, signInErrorCode, signInRetryAfter, signingIn } = useSelector((state: State) => state.auth)
  const { auth } = useDispatch<Dispatch>()

  // On the WEB there is nothing to show a signed-out user — the AS login page IS the
  // sign-in surface, so leave for it immediately (once per landing; an error return
  // stays here so a cancel at the AS can't loop). Desktop keeps the launcher: its
  // window must show something while the SYSTEM browser hosts the journey.
  const autoStart = !browser.isElectron && !signingIn && !signInError
  useEffect(() => {
    if (autoStart) auth.signIn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  if (autoStart || (!browser.isElectron && signingIn))
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} paddingTop={12}>
        <CircularProgress size={28} />
        <Typography variant="body2" color="textSecondary">
          {t('signIn.redirecting', 'Taking you to sign in…')}
        </Typography>
      </Box>
    )

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2} paddingTop={8} paddingX={4}>
      <Typography variant="h1" textAlign="center">
        {t('signIn.title', 'Sign in to {{app}}', { app: brand.appName })}
      </Typography>
      <Typography variant="body2" color="textSecondary" textAlign="center">
        {t('signIn.subtitle', "We'll open your browser to sign you in with Remote.It Single Sign-On.")}
      </Typography>
      {signingIn ? (
        <Box display="flex" flexDirection="column" alignItems="center" gap={1} marginTop={2}>
          <CircularProgress size={28} />
          <Typography variant="caption" color="textSecondary">
            {t('signIn.waiting', 'Waiting for your browser… finish signing in there.')}
          </Typography>
          <Button size="small" onClick={() => auth.set({ signingIn: false })}>
            {t('signIn.cancel', 'Cancel')}
          </Button>
        </Box>
      ) : (
        <Button variant="contained" size="large" onClick={() => auth.signIn()} sx={{ marginTop: 2 }}>
          {/* After a failure the same button is a RETRY — "Sign In" beside an error reads
              as the thing that just didn't work rather than as the way out of it. */}
          {signInError ? t('signIn.retry', 'Try again') : t('signIn.button', 'Sign In')}
        </Button>
      )}
      {!!signInError && <SignInError code={signInErrorCode} detail={signInError} retryAfter={signInRetryAfter} />}
    </Box>
  )
}
