import React from 'react'
import { Link } from '@material-ui/core'
import { Logo } from '../../components/Logo'
import { SignInForm } from '../../components/SignInForm'
import { useTitle, navigate } from 'hookrouter'
import { Props } from '../../controllers/SignInController/SignInController'

export function SignInPage({ login, user }: Props) {
  useTitle('Sign In') // TODO: Translate

  if (user) {
    navigate('/', true)
    return null
  }

  return (
    <div className="h-100 df ai-center jc-center fd-col p-md">
      <div className="mx-auto my-auto" style={{ width: '400px' }}>
        <div className="center mb-md">
          <Logo />
        </div>
        <SignInForm
          onSubmit={({
            password,
            username,
          }: {
            password: string
            username: string
          }) => login({ username, password })}
        />
        <div className="mt-lg center">
          <Link href="https://app.remote.it/auth/#/sign-up" target="blank">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}
