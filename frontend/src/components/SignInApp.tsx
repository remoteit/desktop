import React, { useEffect } from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import browser from '../services/browser'
import brand from '@common/brand/config'
import { oidcIsSupportTab } from '../services/oidc'

/**
 * The sign-in panel is a LAUNCHER now: the whole journey — email-first with org SSO
 * routing, password + MFA, Google, signup, forgot — lives at the authorization server
 * in the SYSTEM browser (permitteer docs/remoteit-desktop-login.md). The backend owns
 * the flow; this panel starts it and waits.
 */
export function SignInApp() {
  const { signInError, signingIn, initialized } = useSelector((state: State) => state.auth)
  const { auth } = useDispatch<Dispatch>()

  // On the WEB there is nothing to show a signed-out user — the AS login page IS the
  // sign-in surface, so leave for it immediately (once per landing; an error return
  // stays here so a cancel at the AS can't loop). Desktop keeps the launcher: its
  // window must show something while the SYSTEM browser hosts the journey.
  // A SUPPORT tab (opened by the console's launch — permitteer docs/desktop-support.md) never
  // auto-starts a plain sign-in: that would sign the operator in as THEMSELVES and quietly turn
  // the support view into their own account. auth.init drives the ticketed authorize; once the
  // session has ended, the tab says so and stops.
  const supportTab = oidcIsSupportTab()
  const autoStart = !browser.isElectron && !signingIn && !signInError && !supportTab
  useEffect(() => {
    if (autoStart) auth.signIn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

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
          Taking you to sign in…
        </Typography>
      </Box>
    )

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2} paddingTop={8} paddingX={4}>
      <Typography variant="h1" textAlign="center">
        Sign in to {brand.appName}
      </Typography>
      <Typography variant="body2" color="textSecondary" textAlign="center">
        We'll open your browser to sign you in with Remote.It Single Sign-On.
      </Typography>
      {signingIn ? (
        <Box display="flex" flexDirection="column" alignItems="center" gap={1} marginTop={2}>
          <CircularProgress size={28} />
          <Typography variant="caption" color="textSecondary">
            Waiting for your browser… finish signing in there.
          </Typography>
          <Button size="small" onClick={() => auth.set({ signingIn: false })}>
            Cancel
          </Button>
        </Box>
      ) : (
        <Button variant="contained" size="large" onClick={() => auth.signIn()} sx={{ marginTop: 2 }}>
          Sign In
        </Button>
      )}
      {signInError && (
        <Typography variant="body2" color="error" textAlign="center">
          {signInError}
        </Typography>
      )}
    </Box>
  )
}
