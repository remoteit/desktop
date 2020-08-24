import React, { useEffect } from 'react'
import { SignInFormController } from '../../controllers/SignInFormController/SignInFormController'
import { Link, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { isElectron } from '../../services/Browser'
import { Logo } from '../../components/Logo'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import styles from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

export function SignInPage() {
  useEffect(() => {
    analyticsHelper.page('SigninPage')
  }, [])

  const css = useStyles()
  const { hostname, protocol } = window.location
  const allowSwitch = !isElectron() && hostname !== 'localhost' && hostname !== '127.0.0.1'
  const secure: boolean = protocol.includes('https')
  const switchUrl = secure ? `http://${hostname}:29999` : `https://${hostname}:29998`
  return (
    <Body center>
      <div className={css.logo}>
        <Logo />
      </div>
      <SignInFormController />
      {allowSwitch && (
        <div className={css.link}>
          {secure ? (
            <div className={css.secure}>
              <Icon name="lock" type="solid" size="xs" inlineLeft /> Secure Session
            </div>
          ) : (
            <div className={css.insecure}>
              <Typography variant="body2" align="center" gutterBottom>
                On an insecure network?{' '}
                <Link href={switchUrl}>
                  <Icon name="lock" type="solid" size="xs" inlineLeft inline />
                  Use secure session
                </Link>
              </Typography>
              <Typography variant="caption">
                You will be prompted by your browser with a security message regarding the remoteitpi.local certificate.
                <br />
                This is normal for local connections. Your data is still encrypted.
                <Link href="http://docs.remote.it/desktop-https" target="_blank">
                  Learn more
                </Link>
              </Typography>
            </div>
          )}
        </div>
      )}
    </Body>
  )
}
const useStyles = makeStyles({
  logo: {
    marginTop: -styles.spacing.xl,
    marginBottom: styles.spacing.lg,
  },
  secure: { color: styles.colors.success },
  insecure: {
    margin: `${styles.spacing.xs}px auto`,
    textAlign: 'center',
    lineHeight: '1em',
    '& > a': { color: styles.colors.success },
  },
  link: {
    marginTop: styles.spacing.xl,
    fontWeight: 400,
  },
})
