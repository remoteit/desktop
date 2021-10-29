import React, { useEffect, useState } from 'react'
import { PERSONAL_PLAN_ID, REMOTEIT_PRODUCT_ID, getRemoteitLicense } from '../models/licensing'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { IOrganizationState } from '../models/organization'
import { OrganizationMember } from '../components/OrganizationMember'
import { OrganizationEmpty } from '../components/OrganizationEmpty'
import { List } from '@material-ui/core'

type Props = { organization: IOrganizationState; owner?: IOrganizationMember }

export const OrganizationMemberList: React.FC<Props> = ({ organization, owner }) => {
  const [removing, setRemoving] = useState<string>()

  const licenses = useSelector((state: ApplicationState) => getRemoteitLicense(state)?.quantity)

  useEffect(() => {
    setRemoving(undefined)
  }, [organization])

  return organization.id ? (
    <List>
      {owner && <OrganizationMember key={owner.user.id} member={owner} disabled />}
      {organization.members.map(member => (
        <OrganizationMember
          key={member.user.id}
          member={member}
          removing={removing === member.user.id}
          onClick={() => setRemoving(member.user.id)}
          disabled={!licenses}
        />
      ))}
    </List>
  ) : (
    <OrganizationEmpty />
  )
}
