import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { ConfirmIconButton } from './ConfirmIconButton'
import { Notice } from '../components/Notice'

export const LeaveOrganizationButton = ({ user }: { user: IUser }) => {
  const dispatch = useDispatch<Dispatch>()
  return (
    <ConfirmIconButton
      confirm
      icon="sign-out"
      title="Leave Account"
      confirmProps={{
        color: 'error',
        action: 'Leave Organization',
        title: 'Are you sure?',
        children: (
          <Notice severity="error" gutterBottom fullWidth>
            This action cannot be undone.
            <em>You would need to contact the Organization owner to be re-added.</em>
          </Notice>
        ),
      }}
      onClick={() => dispatch.accounts.leaveMembership(user.id)}
    />
  )
}
