import React from 'react'
import { Link } from '@material-ui/core'
import { Logo } from '../../components/Logo'
import { SignInForm } from '../../components/SignInForm'

export interface Props {
  onSubmit: (values: { password: string; email: string }) => void
}

export function SignInPage({ onSubmit }: Props) {
  return (
    <div className="h-100 df ai-center jc-center fd-col p-md">
      <div className="mx-auto my-auto" style={{ width: '400px' }}>
        <div className="center mb-md">
          <Logo />
        </div>
        <SignInForm onSubmit={onSubmit} />
        <div className="mt-lg center">
          <Link href="https://app.remote.it/auth/#/sign-up" target="blank">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}
