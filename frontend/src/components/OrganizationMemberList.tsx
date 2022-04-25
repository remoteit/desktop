import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { getFreeLicenses } from '../models/licensing'
import { OrganizationMember } from '../components/OrganizationMember'
import { IOrganizationState } from '../models/organization'
import { List } from '@material-ui/core'

type Props = { organization?: IOrganizationState; owner?: IOrganizationMember; enterprise?: boolean }

export const OrganizationMemberList: React.FC<Props> = ({ organization, owner, enterprise }) => {
  const [removing, setRemoving] = useState<string>()
  const licenses = useSelector((state: ApplicationState) => getFreeLicenses(state))

  useEffect(() => {
    setRemoving(undefined)
  }, [organization])

  return (
    <List>
      {owner && (
        <OrganizationMember
          key={owner.user.id}
          member={owner}
          roles={organization?.roles}
          freeLicenses={false}
          enterprise={enterprise}
        />
      )}
      {organization?.members &&
        organization.members
          .sort(alphaEmailSort)
          .map(member => (
            <OrganizationMember
              key={member.user.id}
              member={member}
              roles={organization?.roles}
              removing={removing === member.user.id}
              onClick={() => setRemoving(member.user.id)}
              freeLicenses={!!licenses || member.license === 'LICENSED'}
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
