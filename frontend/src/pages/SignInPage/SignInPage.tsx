import React, { useEffect } from 'react'
import { Logo } from '../../components/Logo'
import { Body } from '../../components/Body'
import { SignInFormController } from '../../controllers/SignInFormController/SignInFormController'
import { makeStyles } from '@material-ui/styles'
import styles from '../../styling'
import analytics from '../../helpers/Analytics'
import { emit } from '../../services/Controller'

export function SignInPage() {
  useEffect(() => {
    analytics.page('SigninPage')
    emit('interfaces')
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
