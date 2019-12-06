import React from 'react'
import { Logo } from '../../components/Logo'
import { SignInFormController } from '../../controllers/SignInFormController/SignInFormController'
import { makeStyles } from '@material-ui/styles'
import styles from '../../styling'

export function SignInPage() {
  const css = useStyles()

  return (
    <div className={css.container}>
      <div className={css.logo}>
        <Logo />
      </div>
      <SignInFormController />
    </div>
  )
}
const useStyles = makeStyles({
  container: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  logo: {
    marginTop: -styles.spacing.xl,
    marginBottom: styles.spacing.md,
  },
})
