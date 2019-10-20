import React from 'react'
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
      </div>
    </div>
  )
}
