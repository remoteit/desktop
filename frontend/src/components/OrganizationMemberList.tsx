import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { getRemoteitLicense } from '../models/licensing'
import { IOrganizationState } from '../models/organization'
import { OrganizationMember } from '../components/OrganizationMember'
import { OrganizationEmpty } from '../components/OrganizationEmpty'
import { List } from '@material-ui/core'

type Props = { organization: IOrganizationState; owner?: IOrganizationMember }

export const OrganizationMemberList: React.FC<Props> = ({ organization, owner }) => {
  const [removing, setRemoving] = useState<string>()

  const licensesPurchased = useSelector((state: ApplicationState) => getRemoteitLicense(state)?.quantity) || 0
  const licensesUsed =
    1 + organization.members.reduce((sum, member) => sum + (member.license === 'LICENSED' ? 1 : 0), 0)
  const licenses = Math.max(licensesPurchased - licensesUsed, 0)

  useEffect(() => {
    setRemoving(undefined)
  }, [organization])

  return organization.id ? (
    <List>
      {licensesPurchased}-{licensesUsed} = {licenses}
      {owner && <OrganizationMember key={owner.user.id} member={owner} disabled />}
      {organization.members.map(member => (
        <OrganizationMember
          key={member.user.id}
          member={member}
          removing={removing === member.user.id}
          onClick={() => setRemoving(member.user.id)}
          disabled={!licenses && member.license !== 'LICENSED'}
        />
      ))}
    </List>
  ) : (
    <OrganizationEmpty />
  )
}
