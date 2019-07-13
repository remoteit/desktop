import React from 'react'
import { Link } from '@material-ui/core'
import { Logo } from '../../components/Logo'
import { SignInFormController } from '../../controllers/SignInFormController/SignInFormController'

export function SignInPage() {
  return (
    <div className="h-100 df ai-center jc-center fd-col bg-white">
      <div className="mx-auto my-auto" style={{ width: '400px' }}>
        <div className="center mb-md">
          <Logo />
        </div>
        <SignInFormController />
        {/*<div className="mt-lg center">
            <Link href="https://app.remote.it/auth/#/sign-up" target="blank">
              Create an account
            </Link>
          </div>*/}
      </div>
    </div>
  )
}
