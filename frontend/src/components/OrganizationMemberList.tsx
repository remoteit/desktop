import React from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { getAvailableUsers } from '../models/plans'
import { OrganizationMember } from '../components/OrganizationMember'
import { IOrganizationState } from '../models/organization'
import { List } from '@mui/material'

type Props = { organization?: IOrganizationState; owner?: IOrganizationMember; enterprise?: boolean }

export const OrganizationMemberList: React.FC<Props> = ({ organization, owner, enterprise }) => {
  const freeUsers = useSelector((state: State) => getAvailableUsers(state))
  const members = organization?.members ? [...organization.members].sort(alphaEmailSort) : []
  return (
    <List>
      {owner && (
        <OrganizationMember
          disabled
          key={owner.user.id}
          link={true}
          member={owner}
          roles={organization?.roles}
          enterprise={enterprise}
        />
      )}
      {members.map(member => (
        <OrganizationMember
          key={member.user.id}
          member={member}
          roles={organization?.roles}
          disabled={!freeUsers && member.license !== 'LICENSED'}
          enterprise={enterprise}
        />
      ))}
    </List>
  )
}

function alphaEmailSort(a, b) {
  const aa = a.user.email.toLowerCase()
  const bb = b.user.email.toLowerCase()
  return aa > bb ? 1 : aa < bb ? -1 : 0
}
