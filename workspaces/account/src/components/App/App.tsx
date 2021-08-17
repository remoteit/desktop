import React from 'react'
import { useSelector } from 'react-redux'
import { Page } from '../../pages/Page'
import { SignInPage } from '../../pages/SignInPage'
import { Router } from '../../routers/Router'
import { ApplicationState } from '../../store'
import { SignInForm } from '../SignInForm'

export const App: React.FC = () => {

  const { 
    signedOut 
  } = useSelector(
    (state: ApplicationState) => ({
      signedOut: !state.auth.authenticated,
    })
  )
  if (signedOut)
    return (
      <Page>
        <SignInPage >
          <SignInForm/>
        </SignInPage>
       </Page>
    )

  return (
    <>
     <Router />
    </>
  )
}
