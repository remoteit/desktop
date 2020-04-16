import React, { useEffect } from 'react'
import { Logo } from '../../components/Logo'
import { Body } from '../../components/Body'
import { SignInFormController } from '../../controllers/SignInFormController/SignInFormController'
import { makeStyles } from '@material-ui/styles'
import styles from '../../styling'
import Analytics from '../../helpers/Analytics'

export function SignInPage() {
  useEffect(() => {
    Analytics.Instance.page('SigninPage')
  }, [])

  const css = useStyles()

  return (
    <Body center>
      <div className={css.logo}>
        <Logo />
      </div>
      <SignInFormController />
    </Body>
  )
}
const useStyles = makeStyles({
  logo: {
    marginTop: -styles.spacing.xl,
    marginBottom: styles.spacing.lg,
  },
})
