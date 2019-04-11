import Button from '@material-ui/core/Button'
import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Link,
} from '@material-ui/core'
import classes from './SignIn.module.css'
import classnames from 'classnames'
import { useTitle } from 'hookrouter'

export interface Props {}

export function SignIn({ ...props }: Props) {
  useTitle('Sign In')
  return (
    <div className="h-100 df ai-center jc-center fd-col p-md">
      <div className={classnames(classes.card, 'mx-auto my-auto')}>
        <Card>
          <CardHeader title="SignIn" />
          <CardContent>
            <TextField
              defaultValue=""
              fullWidth
              id="user-email"
              label="Email"
              margin="normal"
              required
            />
            <TextField
              defaultValue=""
              fullWidth
              id="user-password"
              label="Password"
              margin="normal"
              required
              type="password"
            />
            <div className="right">
              <Link
                href="https://app.remote.it/auth/#/forgot-password"
                className="txt-sm"
              >
                Forgot your password?
              </Link>
            </div>
            <Button
              color="primary"
              variant="contained"
              fullWidth
              className="mt-md"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
        <div className="mt-lg center">
          <Link href="https://app.remote.it/auth/#/sign-up">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}
