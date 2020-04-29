import React, { useEffect } from 'react'
import { SignInFormController } from '../../controllers/SignInFormController/SignInFormController'
import { makeStyles } from '@material-ui/styles'
import { isElectron } from '../../services/Browser'
import { Logo } from '../../components/Logo'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import { Link } from '@material-ui/core'
import styles from '../../styling'
import analytics from '../../helpers/Analytics'

export function SignInPage() {
  useEffect(() => {
    analytics.page('SigninPage')
  }, [])

  const css = useStyles()
  const { hostname, protocol } = window.location
  const allowSwitch = !isElectron() && hostname !== 'localhost' && hostname !== '127.0.0.1'
  const secure: boolean = protocol.includes('https')
  const switchUrl = secure ? `http://${hostname}:29999` : `https://${hostname}:29998`
  const switchMessage = secure ? (
    'Trusted network? Use standard sign in'
  ) : (
    <>
      Un-trusted network? Use secure sign in <Icon name="lock" weight="solid" size="xs" inline />
    </>
  )

  return (
    <Body center>
      <div className={css.logo}>
        <Logo />
      </div>
      <SignInFormController />
      {allowSwitch && (
        <div className={css.link}>
          {secure && (
            <>
              <Icon name="lock" weight="solid" size="xs" inlineLeft /> Secure
            </>
          )}
          <Link href={switchUrl}>{switchMessage}</Link>
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
  link: {
    marginTop: styles.spacing.xl,
    fontWeight: 400,
  },
})
