import React from 'react'
import { Button, ButtonProps } from '../Button/Button'

export type OktaSignInButtonProps = Omit<ButtonProps, 'children'>

export function OktaSignInButton({ onClick, ...props }: OktaSignInButtonProps): JSX.Element {
  return (
    <Button onClick={onClick} {...props}>
      Sign in with Okta
    </Button>
  )
}
