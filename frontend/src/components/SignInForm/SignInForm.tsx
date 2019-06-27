import React from 'react'
import useFormal from '@kevinwolf/formal-web'
import { Button, TextField, Link } from '@material-ui/core'
import * as yup from 'yup'
import { SignInFormControllerProps } from '../../controllers/SignInFormController/SignInFormController'

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

export function SignInForm({ signIn }: SignInFormControllerProps) {
  const [error, setError] = React.useState<string | undefined>()
  const [loading, setLoading] = React.useState<boolean>(false)

  const formal = useFormal(initialValues, {
    schema,
    onSubmit: ({
      password,
      username,
    }: {
      password: string
      username: string
    }) => {
      setError(undefined)
      setLoading(true)
      signIn({ username, password }).catch((error: string) => {
        console.error('SIGN IN ERROR', error)
        setError(error)
        setLoading(false)
      })
    },
  })

  const usernameProps = formal.getFieldProps('username')
  const passwordProps = formal.getFieldProps('password')
  return (
    <form {...formal.getFormProps()}>
      {error && <div className="bg-danger py-sm px-md white">{error}</div>}
      <div className="mb-sm">
        <TextField
          {...{ ...usernameProps, error: Boolean(usernameProps.error) }}
          autoFocus
          fullWidth
          id="user-username"
          label="Email or Username"
          margin="normal"
          // type="email"
          // variant="filled"
        />
        {formal.errors.username && (
          <span className="danger txt-sm">{formal.errors.username}</span>
        )}
      </div>

      <div className="my-sm">
        <TextField
          {...{ ...passwordProps, error: Boolean(passwordProps.error) }}
          fullWidth
          id="user-password"
          label="Password"
          margin="normal"
          type="password"
        />
        {formal.errors.password && (
          <span className="danger txt-sm">{formal.errors.password}</span>
        )}
      </div>

      <div className="right">
        <Link
          href="https://app.remote.it/auth/#/forgot-password"
          className="txt-sm"
        >
          Forgot your password?
        </Link>
      </div>
      <Button
        {...formal.getSubmitButtonProps()}
        color="primary"
        variant="contained"
        fullWidth
        className="mt-md"
        disabled={loading}
        type="submit"
      >
        {loading ? 'Signing you in...' : 'Sign in'}
      </Button>
    </form>
  )
}
