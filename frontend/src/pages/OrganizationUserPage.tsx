import React from 'react'
import { Redirect } from 'react-router-dom'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { REGEX_LAST_PATH } from '../constants'
import { selectOrganization } from '../selectors/organizations'
import { RemoveMemberButton } from '../buttons/RemoveMemberButton'
import { useParams, useLocation } from 'react-router-dom'
import { LeaveOrganizationButton } from '../buttons/LeaveOrganizationButton'
import { OrganizationMemberDetails } from '../components/OrganizationMemberDetails'
import { OrganizationGuestDetails } from '../components/OrganizationGuestDetails'
import { Typography } from '@mui/material'
import { LinearProgress } from '../components/LinearProgress'
import { Container } from '../components/Container'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'

export const OrganizationUserPage: React.FC = () => {
  const location = useLocation()
  const { userID = '' } = useParams<{ userID: string }>()

  const organization = useSelector((state: State) => selectOrganization(state))
  const myAccount = useSelector((state: State) => (state.user.id === userID ? state.user : undefined))
  const guest = organization.guests.find(g => g.id === userID)
  const member = organization.members.find(m => m.user.id === userID) || organization.membership
  const guestsLoaded = organization.guestsLoaded

  const user = guest || member?.user || myAccount

  if (!user || organization.id === user.id)
    return (
      <Redirect
        to={{
          pathname: myAccount ? '/account' : location.pathname.replace(REGEX_LAST_PATH, ''),
          state: { isRedirect: true },
        }}
      />
    )

  return (
    <Container
      header={
        <>
          <Typography variant="h1" marginTop={1} gutterBottom>
            <Title>
              <Avatar email={user?.email} size={46} inline />
              {user?.email}
            </Title>
            {member && myAccount ? (
              <LeaveOrganizationButton organizationId={organization.id} />
            ) : (
              <RemoveMemberButton member={member} />
            )}
          </Typography>
          {!guestsLoaded && <LinearProgress loading />}
        </>
      }
    >
      <OrganizationMemberDetails member={member} organization={organization} />
      <OrganizationGuestDetails guest={guest} loaded={guestsLoaded} />
    </Container>
  )
}
