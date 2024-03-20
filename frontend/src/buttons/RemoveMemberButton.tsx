import React, { useState } from 'react'
import { Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ConfirmIconButton } from './ConfirmIconButton'

export const RemoveMemberButton = ({ member }: { member: IOrganizationMember }) => {
  const [removing, setRemoving] = useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  return (
    <ConfirmIconButton
      confirm
      confirmProps={{
        title: 'Remove Member',
        color: 'error',
        children: (
          <>
            This will remove <b>{member.user.email}’s </b>
            access to all the organization’s devices
          </>
        ),
      }}
      title="Remove Member"
      icon="trash"
      size="md"
      color={removing ? 'danger' : undefined}
      loading={removing}
      disabled={removing}
      onClick={async () => {
        setRemoving(true)
        await dispatch.organization.removeMember(member)
        history.push('/organization/members')
        setRemoving(false)
      }}
    />
  )
}
