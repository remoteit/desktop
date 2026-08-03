import React from 'react'
import { useSelector } from 'react-redux'
import { selectAvailableUsers } from '../selectors/organizations'
import { OrganizationMember } from '../components/OrganizationMember'
import { alphaSort } from '../helpers/utilHelper'
import { IOrganizationState } from '../models/organization'
import { List } from '@mui/material'

type Props = { organization?: IOrganizationState; owner?: IOrganizationMember; enterprise?: boolean }

export const OrganizationMemberList: React.FC<Props> = ({ organization, owner, enterprise }) => {
  const freeUsers = useSelector(selectAvailableUsers)
  const members = organization?.members ? [...organization.members].sort((a, b) => alphaSort(a.user.email, b.user.email)) : []
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

