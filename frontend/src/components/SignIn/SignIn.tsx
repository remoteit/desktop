import Button from '@material-ui/core/Button'
import React from 'react'
import classes from './SignIn.module.css'
import classnames from 'classnames'
import useFormal from '@kevinwolf/formal-web'
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Link,
} from '@material-ui/core'
import { useTitle } from 'hookrouter'
import { User } from '../../models/User'
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

export interface Props {}

export function SignIn({ ...props }: Props) {
  useTitle('Sign In')

  const formal = useFormal(initialValues, {
    schema,
    onSubmit: async values => {
      console.log('Form values:', values)
      // TODO: Handle errors!
      const user = await User.login(values.email, values.password)
      console.log('USER:', user)
    },
  })

  const emailProps = formal.getFieldProps('email')
  const passwordProps = formal.getFieldProps('password')

  return (
    <div className="h-100 df ai-center jc-center fd-col p-md">
      <div className={classnames(classes.card, 'mx-auto my-auto')}>
        <Card>
          <CardHeader title="SignIn" />
          <CardContent>
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
                  <span className="danger txt-sm">
                    {formal.errors.password}
                  </span>
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
          </CardContent>
        </Card>
        <div className="mt-lg center">
          <Link href="https://app.remote.it/auth/#/sign-up" target="blank">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}
