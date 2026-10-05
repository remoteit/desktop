import React, { useEffect } from 'react'
import { Box, Button, Link as MuiLink, Typography, CircularProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { oidcAutoStartExhausted, oidcIsSupportTab, oidcLeaveRefused, oidcReopen } from '../services/oidc'
import { SignInErrorCode } from '../models/auth'
import { AgentOwner, parseAgentOwned } from '@common/agentOwner'
import { DESKTOP_HELP_LINK, MODE, OAUTH_ISSUER, STAGE, STAGE_PINNED, STAGES } from '../constants'
import browser from '../services/browser'
import { Notice } from './Notice'
import { CopyCodeBlock } from './CopyCodeBlock'
import { Icon } from './Icon'
import { ColorChip } from './ColorChip'
import { Link } from './Link'
import { Logo } from '@common/brand/Logo'

// The page centres its content; padding below lifts it to where the eye reads the middle.
const OPTICAL_LIFT = '4vh'

const ISSUER_HOST = (() => {
  try {
    return new URL(OAUTH_ISSUER).host
  } catch {
    return OAUTH_ISSUER
  }
})()

/**
 * The sign-in panel is a LAUNCHER now: the whole journey — email-first with org SSO
 * routing, password + MFA, Google, signup, forgot — lives at the authorization server
 * in the SYSTEM browser (permitteer docs/remoteit-desktop-login.md). The renderer owns
 * the flow (services/oidc); this panel starts it and waits.
 */

/* What a failed sign-in tells the person to DO. Keyed by the reason rather than by the
   server's wording, because the two things a stuck user needs — "is this me or them?"
   and "do I retry or wait?" — are not in an error_description. The raw detail is shown
   underneath, quietly, so a support conversation still has something to go on. */
const SignInError: React.FC<{
  code?: SignInErrorCode
  detail?: string
  retryAfter?: number
  agentOwner?: AgentOwner
}> = ({ code, detail, retryAfter, agentOwner }) => {
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
      case 'agentOwned':
        return t(
          'signIn.agentOwnedDetail',
          '{{owner}} is still signed in on this computer. Sign in as {{owner}} and sign out first, or run this in a terminal as an administrator:',
          { owner: agentOwner?.username }
        )
      case 'expired':
        return t('signIn.errorExpired', 'That sign-in attempt expired before it finished. Please try again.')
      default:
        return t('signIn.errorUnknown', "Sign in didn't complete. Please try again.")
    }
  }

  return (
    <Notice severity={agentOwner ? 'warning' : 'error'} fullWidth>
      {message()}
      {!!detail && showDetail && !agentOwner && (
        <Typography variant="caption" component="p" color="grayDark.main">
          {detail}
        </Typography>
      )}
      {agentOwner && <CopyCodeBlock value={agentOwner.command} hideCopyLabel sx={{ marginTop: 1 }} />}
    </Notice>
  )
}

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
  // A SUPPORT tab (opened by the console's launch — permitteer docs/desktop-support.md) says so
  // below instead of offering a sign-in; auth.init drives its ticketed authorize, and oidcStart
  // refuses every other start there (oidcLeaveRefused), so it can never sign the operator in as
  // themselves.
  const supportTab = oidcIsSupportTab()
  const budgetSpent = oidcAutoStartExhausted('boot')
  const otherStage = !STAGE_PINNED && STAGE !== 'prod' ? STAGE : undefined
  const autoStart =
    !browser.isElectron && !otherStage && !signingIn && !signInFailed && !budgetSpent && !oidcLeaveRefused()
  useEffect(() => {
    if (!autoStart) return
    auth.signIn({ auto: 'boot' })
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
        'signIn.autoPaused',
        'Automatic sign-in stopped after repeated attempts. Choose how to sign in below.'
      ),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetSpent, signInFailed, signingIn])
  if (supportTab)
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} paddingX={4} paddingBottom={OPTICAL_LIFT}>
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

  if (autoStart || (!browser.isNative && signingIn))
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} paddingBottom={OPTICAL_LIFT}>
        <CircularProgress size={28} />
        <Typography variant="body2" color="textSecondary">
          {t('signIn.redirecting', 'Taking you to sign in…')}
        </Typography>
      </Box>
    )

  const agentOwner = signInFailed && signInErrorCode === 'agentOwned' ? parseAgentOwned(signInError) : undefined
  const retryable = signInFailed && !agentOwner

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={3} paddingX={4} paddingBottom={OPTICAL_LIFT}>
      {otherStage && (
        <ColorChip
          size="small"
          color="warning"
          icon={<Icon name="flask" size="sm" />}
          label={`${STAGES[otherStage].name} · ${ISSUER_HOST}`}
        />
      )}
      <Logo width={140} />
      {signingIn ? (
        <>
          <Box display="flex" alignItems="center" gap={1.5}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="textSecondary">
              {t('signIn.continueInBrowser', 'Continue in your browser')}
            </Typography>
          </Box>
          <Box display="grid" gridAutoFlow="column" gridAutoColumns="1fr" gap={1}>
            <Button size="large" onClick={() => auth.set({ signingIn: false })}>
              {t('signIn.cancel', 'Cancel')}
            </Button>
            <Button variant="contained" size="large" onClick={() => oidcReopen()}>
              {t('signIn.openAgain', 'Open again')}
            </Button>
          </Box>
        </>
      ) : (
        <>
          {signInFailed ? (
            <SignInError
              code={signInErrorCode}
              detail={signInError}
              retryAfter={signInRetryAfter}
              agentOwner={agentOwner}
            />
          ) : (
            <Typography variant="h2">{t('signIn.heading', 'Sign in')}</Typography>
          )}
          <Box display="flex" flexDirection="column" gap={1.5} width={280}>
            <Button variant="contained" size="large" sx={{ width: '100%' }} onClick={() => auth.signIn()}>
              {t('signIn.continueEmail', 'Continue with email')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ width: '100%' }}
              onClick={() => auth.signIn({ idpHint: 'google' })}
            >
              {t('signIn.continueGoogle', 'Continue with Google')}
            </Button>
          </Box>
          <Typography variant="body2" color="textSecondary">
            {t('signIn.noAccount', "Don't have an account?")}{' '}
            <MuiLink component="button" variant="body2" onClick={() => auth.signIn({ signUp: true })}>
              {t('signIn.signUp', 'Sign up')}
            </MuiLink>
          </Typography>
        </>
      )}
      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
        {retryable && (
          <Link href={DESKTOP_HELP_LINK} variant="caption" noUnderline>
            {t('signIn.help', 'Get help')}
          </Link>
        )}
        {otherStage && (
          <MuiLink component="button" variant="caption" onClick={() => auth.switchStage('prod')}>
            {t('signIn.switchToProduction', 'Switch to production')}
          </MuiLink>
        )}
      </Box>
    </Box>
  )
}
