import React from 'react'
import { SignOutLinkControllerProps } from '../../controllers/SignOutLinkController/SignOutLinkController'
import { Link } from '@material-ui/core'

export function SignOutLink({ signOut }: SignOutLinkControllerProps) {
  return (
    <Link onClick={() => signOut()} type="button" className="c-pointer">
      Sign out
    </Link>
  )
}
