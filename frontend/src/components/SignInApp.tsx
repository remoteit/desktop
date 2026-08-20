import React, { useEffect } from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import browser from '../services/browser'
import brand from '@common/brand/config'

/**
 * The sign-in panel is a LAUNCHER now: the whole journey — email-first with org SSO
 * routing, password + MFA, Google, signup, forgot — lives at the authorization server
 * in the SYSTEM browser (permitteer docs/remoteit-desktop-login.md). The backend owns
 * the flow; this panel starts it and waits.
 */
export function SignInApp() {
  const { signInError, signingIn } = useSelector((state: State) => state.auth)
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
        Sign-in opens in your browser — password managers, single sign-on, and multi-account switching all work there.
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
