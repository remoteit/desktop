import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, CircularProgress, List, ListItem, ListItemText } from '@mui/material'
import { Dispatch, State } from '../store'
import { oidcSignedIn } from '../services/oidc'
import { SignInError } from './SignInApp'

/* This device, signed out in an app (device-package docs/one-app-plan.md): the machine's own controls work through the
   bridge with no sign-in and no network, and the sign-in is here — the shell's (services/oidc, "the SHELL's sign-in"),
   which reloads the page as the person once it is done. Signed in on the app but remote.it not reached (offline, or
   its API down) is said apart, with a retry: signing in again would not help. Offline, each says so: the controls
   here work, the rest waits for the network. */
export const ThisDeviceSignIn: React.FC = () => {
  const { t } = useTranslation()
  const { signingIn, signInFailed, signInError, signInErrorCode, signInRetryAfter } = useSelector(
    (state: State) => state.auth
  )
  const offline = useSelector((state: State) => !!state.ui.offline)
  const { auth } = useDispatch<Dispatch>()
  const unreachable = oidcSignedIn()

  if (unreachable)
    return (
      <List data-section="signIn" data-sign-in="unreachable">
        <ListItem>
          <ListItemText
            primary={t('thisDevice.unreachable', 'Can’t reach remote.it')}
            secondary={
              offline
                ? t(
                    'thisDevice.offlineSignedIn',
                    'You’re signed in, but this device is offline. Its own controls below work meanwhile.'
                  )
                : t(
                    'thisDevice.unreachableLine',
                    'You’re signed in, but remote.it can’t be reached from here. This device’s own controls below work meanwhile.'
                  )
            }
          />
        </ListItem>
        <Box paddingX={2}>
          <Button variant="outlined" size="small" onClick={() => window.location.reload()} data-control="retry">
            {t('signIn.retry', 'Try again')}
          </Button>
        </Box>
      </List>
    )

  return (
    <List data-section="signIn" data-sign-in={signingIn ? 'waiting' : 'signedOut'}>
      <ListItem>
        <ListItemText
          primary={t('thisDevice.signedOut', 'Not signed in')}
          secondary={
            signingIn
              ? t('signIn.waiting', 'Waiting for your browser… finish signing in there.')
              : offline
              ? t(
                  'thisDevice.offlineSignIn',
                  'This device is offline. Its own controls below work meanwhile; sign in once it’s back online.'
                )
              : t(
                  'thisDevice.signInLine',
                  'This device’s own controls below work without signing in. Sign in for your other devices, sharing and the rest of remote.it.'
                )
          }
        />
      </ListItem>
      <Box paddingX={2} display="flex" alignItems="center" gap={1}>
        {signingIn ? (
          <>
            <CircularProgress size={20} />
            <Button size="small" onClick={() => auth.set({ signingIn: false })}>
              {t('signIn.cancel', 'Cancel')}
            </Button>
          </>
        ) : (
          <Button variant="contained" size="small" onClick={() => auth.signIn()} data-control="signIn">
            {signInFailed ? t('signIn.retry', 'Try again') : t('signIn.button', 'Sign In')}
          </Button>
        )}
      </Box>
      {signInFailed && (
        <Box paddingX={2} paddingTop={1}>
          <SignInError code={signInErrorCode} detail={signInError} retryAfter={signInRetryAfter} />
        </Box>
      )}
    </List>
  )
}
