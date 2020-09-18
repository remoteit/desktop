import { CLIENT_ID, API_URL, DEVELOPER_KEY } from '../../shared/constants'
import theme from '../../styling/theme'
import React from 'react'
import styles from '../../styling'
import { makeStyles } from '@material-ui/core/styles'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { CognitoAuth } from '@remote.it/components'

export function SignInForm() {
  const css = useStyles()
  const { signInError } = useSelector((state: ApplicationState) => state.auth)
  const { auth } = useDispatch<Dispatch>()

  return (
    <React.Fragment>
      {signInError && <div className={css.error}>{signInError}</div>}
      <CognitoAuth
        themeOverride={theme}
        onSignInSuccess={auth.handleSignInSuccess}
        showLogo={false}
        clientId={CLIENT_ID}
        apiURL={API_URL}
        developerKey={DEVELOPER_KEY}
      />
    </React.Fragment>
  )
}

const useStyles = makeStyles({
  form: {
    width: 400,
  },
  error: {
    backgroundColor: styles.colors.danger,
    padding: `${styles.spacing.sm}px ${styles.spacing.md}px`,
    marginBottom: styles.spacing.md,
    color: styles.colors.white,
  },
  section: {
    marginBottom: styles.spacing.sm,
  },
  fieldError: {
    color: styles.colors.danger,
    fontSize: styles.fontSizes.sm,
  },
  signIn: {
    marginTop: styles.spacing.xl,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  links: {
    marginLeft: styles.spacing.lg,
    lineHeight: '1.7em',
    textAlign: 'center',
  },
})
