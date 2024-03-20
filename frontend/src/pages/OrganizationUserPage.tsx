import React from 'react'
import { Redirect } from 'react-router-dom'
import { State } from '../store'
import { Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { ProfilePage } from './ProfilePage'
import { REGEX_LAST_PATH } from '../constants'
import { RemoveMemberButton } from '../buttons/RemoveMemberButton'
import { useParams, useLocation } from 'react-router-dom'
import { LeaveOrganizationButton } from '../buttons/LeaveOrganizationButton'
import { OrganizationMemberDetails } from '../components/OrganizationMemberDetails'
import { selectOrganization, selectOwner } from '../selectors/organizations'
import { OrganizationGuestDetails } from '../components/OrganizationGuestDetails'
import { Container } from '../components/Container'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'

export const OrganizationUserPage: React.FC = () => {
  const location = useLocation()
  const { userID = '' } = useParams<{ userID: string }>()

  let user: IUser = useSelector((state: State) => state.user)
  const owner = useSelector(selectOwner)
  const organization = useSelector(selectOrganization)
  const isOwnerAccount = user.id === userID && organization.id === userID
  const isMyAccount = user.id === userID || undefined
  const member = organization.members.find(m => m.user.id === userID) || (isMyAccount && organization.membership)
  const guest = organization.guests.find(g => g.id === userID)

  user = guest || member?.user || (owner?.user.id === userID && owner.user) || user

  if (isOwnerAccount) return <ProfilePage />

  if (!user)
    return (
      <Redirect
        to={{
          pathname: location.pathname.replace(REGEX_LAST_PATH, ''),
          state: { isRedirect: true },
        }}
      />
    )

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1" marginTop={1} gutterBottom>
          <Title>
            <Avatar email={user?.email} marginRight={16} />
            {user?.email}
          </Title>
          {isMyAccount ? (
            <LeaveOrganizationButton organizationId={organization.id} />
          ) : (
            member && <RemoveMemberButton member={member} />
          )}
        </Typography>
      }
    >
      <OrganizationMemberDetails member={member} organization={organization} />
      <OrganizationGuestDetails guest={guest} loaded={organization.guestsLoaded} />
    </Container>
  )
}
