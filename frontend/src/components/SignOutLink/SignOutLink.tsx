import React from 'react'
import { SignOutLinkControllerProps } from '../../controllers/SignOutLinkController/SignOutLinkController'
import { Link } from '@material-ui/core'
import { Icon } from '../Icon'

export function SignOutLink({ signOut }: SignOutLinkControllerProps) {
  return (
    <Link onClick={() => signOut()} type="button" className="c-pointer">
      <Icon name="sign-out" className="mr-sm" />
      Sign out
    </Link>
  )
}
