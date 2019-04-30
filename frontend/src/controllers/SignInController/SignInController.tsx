import React from 'react'
import { SignInPage } from '../../components/SignInPage'
import { User } from '../../models/User'
import { navigate, useTitle } from 'hookrouter'
import { useStore } from '../../store'
import { actions } from '../../actions'

export function SignInController() {
  useTitle('Sign In') // TODO: Translate

  const [{ auth }, dispatch] = useStore()

  // TODO: Fetch login state from cookies

  if (auth.user) {
    navigate('/', true)
    return null
  }

  return (
    <SignInPage
      onSubmit={async (values: { password: string; email: string }) => {
        console.log('Form values:', values)
        // TODO: Handle errors!
        const user = await User.login(values.email, values.password)
        console.log('User data:', user)
        dispatch({ type: actions.auth.login, user })
      }}
    />
  )
}
