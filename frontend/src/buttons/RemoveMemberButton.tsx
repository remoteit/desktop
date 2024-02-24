import React, { useState } from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { ConfirmIconButton } from './ConfirmIconButton'

export const RemoveMemberButton = ({ member }: { member: IOrganizationMember }) => {
  const [removing, setRemoving] = useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  return (
    <ConfirmIconButton
      confirm
      confirmProps={{
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
        setRemoving(false)
      }}
    />
  )
}
