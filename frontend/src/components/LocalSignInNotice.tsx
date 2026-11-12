import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Link } from '@mui/material'
import browser from '../services/browser'
import { forgetLocal, LocalSignIn, openSignInLink } from '../services/localSubnet'
import { Notice } from './Notice'

// How often, and how long, this machine's daemon is asked again after Sign in: the person finishes in the browser tab
// the app opens, and the next answer names the service — Connect then hands off to the daemon as usual.
export const SIGN_IN_POLL_MS = 3000
export const SIGN_IN_POLL_FOR_MS = 3 * 60_000

/* remote.it is installed on this computer but does not act for this person: they are signed in on no account of it
   (graphql-api docs/PROXY-GROUPS.md §15, "The portal and an installed daemon"). Connect goes through this page's own
   client meanwhile; Sign in hands off to the installed app's own sign-in — the link opens the app, which signs in with
   Permitteer itself. Never opened without the person's click, and nothing is passed to it. Where the app takes no link
   (an older package), where to sign in is said instead. */
export const LocalSignInNotice: React.FC<{ signIn: LocalSignIn }> = ({ signIn }) => {
  const { t } = useTranslation()
  const [asked, setAsked] = useState(false)

  useEffect(() => {
    if (!asked) return
    const until = Date.now() + SIGN_IN_POLL_FOR_MS
    const timer = window.setInterval(() => {
      if (Date.now() > until) return window.clearInterval(timer)
      forgetLocal()
    }, SIGN_IN_POLL_MS)
    return () => window.clearInterval(timer)
  }, [asked])

  const where = browser.isMac
    ? t('localSignIn.whereMac', 'Open remote.it from the menu bar and choose Sign in.')
    : browser.isWindows
    ? t('localSignIn.whereWindows', 'Open remote.it from the notification area and choose Sign in.')
    : t('localSignIn.whereOther', 'Open remote.it from the top bar or the app grid and choose Sign in.')

  const signInHere = () => {
    if (signIn.link) openSignInLink(signIn.link)
    setAsked(true)
  }

  const checkAgain = () => {
    forgetLocal()
    setAsked(true)
  }

  return (
    <Notice
      severity="info"
      fullWidth
      gutterBottom
      button={
        signIn.link && !asked ? (
          <Button size="small" variant="contained" color="primary" onClick={signInHere}>
            {t('localSignIn.signIn', 'Sign in')}
          </Button>
        ) : undefined
      }
    >
      <strong>{t('localSignIn.title', "remote.it on this computer isn't signed in")}</strong>
      <em>
        {asked && signIn.link
          ? t('localSignIn.asked', 'Finish signing in where remote.it opened it; Connect uses it once you have.')
          : t(
              'localSignIn.body',
              'Until you sign in there, Connect goes through this browser. Signing in lets this computer reach your devices by name.'
            )}
      </em>
      {(!signIn.link || asked) && (
        <em>
          {signIn.link ? `${t('localSignIn.nothingOpened', 'Nothing opened?')} ${where}` : where}{' '}
          <Link component="button" variant="caption" onClick={checkAgain}>
            {t('localSignIn.checkAgain', 'Check again')}
          </Link>
        </em>
      )}
    </Notice>
  )
}
