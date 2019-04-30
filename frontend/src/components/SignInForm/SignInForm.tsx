import React from 'react'
import useFormal from '@kevinwolf/formal-web'
import { Button, TextField, Link } from '@material-ui/core'
import * as yup from 'yup'

const schema = yup.object().shape({
  email: yup
    .string()
    .email()
    .required(),
  password: yup
    .string()
    .min(7)
    .max(64)
    .required(),
})

const initialValues = {
  password: '',
  email: '',
}

export interface Props {
  onSubmit: (value: typeof initialValues) => void
}

export function SignInForm({ onSubmit }: Props) {
  const formal = useFormal(initialValues, {
    schema,
    onSubmit,
  })

  const emailProps = formal.getFieldProps('email')
  const passwordProps = formal.getFieldProps('password')
  return (
    <form {...formal.getFormProps()}>
      <div className="mb-sm">
        <TextField
          {...{ ...emailProps, error: Boolean(emailProps.error) }}
          autoFocus
          fullWidth
          id="user-email"
          label="Email"
          margin="normal"
          // type="email"
          // variant="filled"
        />
        {formal.errors.email && (
          <span className="danger txt-sm">{formal.errors.email}</span>
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
        type="submit"
      >
        Sign In
      </Button>
    </form>
  )
}
