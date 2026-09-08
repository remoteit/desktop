import React, { useEffect } from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { OidcErrorCode, oidcAutoStartsSpent, oidcCountAutoStart } from '../services/oidc'
import { MODE } from '../constants'
import browser from '../services/browser'
import brand from '@common/brand/config'
import { oidcIsSupportTab } from '../services/oidc'

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
  /* The server's own wording, shown only where someone is equipped to read it. It names
     internal machinery — resource identifiers, endpoints, an authorization_details type —
     which is what makes it useful in a bug report and wrong on a stranger's screen,
     untranslated, under a sentence written for them. console.error still carries it for
     everyone, so a support session loses nothing. */
  const showDetail = useSelector((state: State) => MODE === 'development' || !!state.ui.testUI)
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
      {!!detail && showDetail && (
        <Typography variant="caption" color="grayDark.main" textAlign="center">
          {detail}
        </Typography>
      )}
    </Box>
  )
}

/* How many authorizes this tab may start with nobody asking. Two, because one legitimate
   retry (a token that died mid-session) is normal and a third in one tab never is. */
const AUTO_START_LIMIT = 2

export function SignInApp() {
  const { t } = useTranslation()
  const { signInFailed, signInError, signInErrorCode, signInRetryAfter, signingIn, initialized } = useSelector(
    (state: State) => state.auth
  )
  const { auth, ui } = useDispatch<Dispatch>()

  /* On the WEB there is nothing to show a signed-out user — the AS login page IS the
     sign-in surface, so leave for it immediately. Desktop keeps the launcher: its window
     must show something while the SYSTEM browser hosts the journey.

     TWO brakes, because this effect redirects the browser and the redirect can come
     straight back. signInFailed is the real one: any failed attempt parks us here with an
     explanation instead of bouncing. The spend counter is the backstop for the case that
     actually bit — a path that returns without recording the failure — since an automatic
     authorize renders nothing to a person and the first visible symptom is the AS
     rate-limiting the address. A click is never counted against it. */
  // A SUPPORT tab (opened by the console's launch — permitteer docs/desktop-support.md) never
  // auto-starts a plain sign-in: that would sign the operator in as THEMSELVES and quietly turn
  // the support view into their own account. auth.init drives the ticketed authorize; once the
  // session has ended, the tab says so and stops.
  const supportTab = oidcIsSupportTab()
  const budgetSpent = oidcAutoStartsSpent() >= AUTO_START_LIMIT
  const autoStart = !browser.isElectron && !signingIn && !signInFailed && !budgetSpent && !supportTab
  useEffect(() => {
    if (!autoStart) return
    oidcCountAutoStart()
    auth.signIn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  /* The backstop is silent by construction — it catches the case where NOTHING recorded a
     failure, so there is no error on screen to explain why the redirect stopped. Said
     through the app's own snackbar (Page renders it over the signed-out screen too)
     rather than by growing a second error surface on this panel. */
  useEffect(() => {
    if (browser.isElectron || signingIn || signInFailed || !budgetSpent) return
    ui.set({
      noticeMessage: t(
        'signIn.autoStopped',
        'Automatic sign-in stopped after repeated attempts. Select Sign In to try again.'
      ),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetSpent, signInFailed, signingIn])
  if (supportTab)
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} paddingTop={12} paddingX={4}>
        {initialized ? (
          <>
            <Typography variant="h1" textAlign="center">
              Support session ended
            </Typography>
            <Typography variant="body2" color="textSecondary" textAlign="center">
              Close this tab to return to the console.
            </Typography>
          </>
        ) : (
          <>
            <CircularProgress size={28} />
            <Typography variant="body2" color="textSecondary">
              Opening the support session…
            </Typography>
          </>
        )}
      </Box>
    )

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
          {signInFailed ? t('signIn.retry', 'Try again') : t('signIn.button', 'Sign In')}
        </Button>
      )}
      {signInFailed && <SignInError code={signInErrorCode} detail={signInError} retryAfter={signInRetryAfter} />}
    </Box>
  )
}
