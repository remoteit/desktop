import React, { useEffect, useState } from 'react'
// import { Dispatch } from '../store'
// import { useDispatch } from 'react-redux'
import { List } from '@material-ui/core'
import { IOrganizationState } from '../models/organization'
import { OrganizationMember } from '../components/OrganizationMember'
import { OrganizationEmpty } from '../components/OrganizationEmpty'

type Props = { organization: IOrganizationState }

export const OrganizationMemberList: React.FC<Props> = ({ organization }) => {
  const [removing, setRemoving] = useState<string>()

  useEffect(() => {
    setRemoving(undefined)
  }, [organization])

  return organization.id ? (
    <List>
      {organization.members.map(member => (
        <OrganizationMember
          key={member.user.id}
          member={member}
          removing={removing === member.user.id}
          onClick={() => setRemoving(member.user.id)}
        />
      ))}
    </List>
  ) : (
    <OrganizationEmpty />
  )
}
