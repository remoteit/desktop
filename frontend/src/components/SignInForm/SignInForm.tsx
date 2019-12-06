import React from 'react'
import useFormal from '@kevinwolf/formal-web'
import { makeStyles } from '@material-ui/styles'
import { Button, TextField, Link } from '@material-ui/core'
import { SignInFormControllerProps } from '../../controllers/SignInFormController/SignInFormController'
import styles from '../../styling'
import * as yup from 'yup'

const schema = yup.object().shape({
  username: yup
    .string()
    // .email()
    .required(),
  password: yup
    .string()
    .min(7)
    .max(64)
    .required(),
})

const initialValues = {
  password: '',
  username: '',
}

export function SignInForm({ signInError, signInStarted, signIn }: SignInFormControllerProps) {
  const css = useStyles()
  const formal = useFormal(initialValues, {
    schema,
    onSubmit: ({ password, username }: { password: string; username: string }) => {
      signIn({ username, password })
    },
  })

  const usernameProps = formal.getFieldProps('username')
  const passwordProps = formal.getFieldProps('password')
  return (
    <form className={css.form} {...formal.getFormProps()}>
      {signInError && <div className={css.error}>{signInError}</div>}
      <div className={css.section}>
        <TextField
          {...{ ...usernameProps, error: Boolean(usernameProps.error) }}
          autoFocus
          fullWidth
          variant="filled"
          id="user-username"
          label="Email or Username"
          margin="normal"
          // type="email"
          // variant="filled"
        />
        {formal.errors.username && <span className={css.fieldError}>{formal.errors.username}</span>}
      </div>
      <div className={css.section}>
        <TextField
          {...{ ...passwordProps, error: Boolean(passwordProps.error) }}
          fullWidth
          variant="filled"
          id="user-password"
          label="Password"
          margin="normal"
          type="password"
        />
        {formal.errors.password && <span className={css.fieldError}>{formal.errors.password}</span>}
      </div>
      <div className={css.signIn}>
        <Button
          {...formal.getSubmitButtonProps()}
          color="primary"
          variant="contained"
          disabled={signInStarted}
          type="submit"
        >
          {signInStarted ? 'Signing you in...' : 'Sign in'}
        </Button>
        <Link href="https://app.remote.it/auth/#/sign-up" target="_blank">
          Create an account
        </Link>
      </div>
    </form>
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
})
