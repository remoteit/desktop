import React from 'react'
import { Link } from '@material-ui/core'
import { Logo } from '../../components/Logo'
import { SignInForm } from '../../components/SignInForm'
import { useTitle } from 'hookrouter'
import { SignInFormController } from '../../controllers/SignInFormController/SignInFormController'
import { Page } from '../Page'

export function SignInPage() {
  useTitle('Sign In') // TODO: Translate

  return (
    <Page>
      <div className="h-100 df ai-center jc-center fd-col p-md">
        <div className="mx-auto my-auto" style={{ width: '400px' }}>
          <div className="center mb-md">
            <Logo />
          </div>
          <SignInFormController />
          <div className="mt-lg center">
            <Link href="https://app.remote.it/auth/#/sign-up" target="blank">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </Page>
  )
}
