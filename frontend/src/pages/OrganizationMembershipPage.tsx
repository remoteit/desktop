import React from 'react'
import { ApplicationState, Dispatch } from '../store'
import {
  Typography,
  Divider,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { selectOwnRemoteitLicense } from '../models/plans'
import { getOwnOrganization } from '../models/organization'
import { LicenseChip } from '../components/LicenseChip'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Duration } from '../components/Duration'
import { spacing } from '../styling'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'
import { Body } from '../components/Body'

export const OrganizationMembershipPage: React.FC = () => {
  const { memberships, organization, license, email } = useSelector((state: ApplicationState) => ({
    memberships: state.accounts.membership,
    organization: getOwnOrganization(state),
    license: selectOwnRemoteitLicense(state),
    email: state.auth.user?.email || '',
  }))
  const { accounts } = useDispatch<Dispatch>()

  return (
    <Container
      header={
        <Typography variant="h1">
          <Title>Organization Memberships</Title>
        </Typography>
      }
    >
      {memberships.length ? (
        <List>
          {organization && (
            <>
              <ListItem key={organization.id}>
                <ListItemIcon>
                  <Avatar email={email} title={organization.name} size={28} />
                </ListItemIcon>
                <ListItemText primary={organization.name} secondary="Your organization" />
                <ListItemSecondaryAction>
                  <Chip label={organization.roles.find(r => r.id === 'OWNER')?.name} size="small" />
                  <Box width={100} display="inline-block" textAlign="right" marginRight={`${spacing.md}px`}>
                    <LicenseChip license={license?.valid ? 'LICENSED' : 'UNLICENSED'} />
                  </Box>
                  <IconButton icon="pencil" title="Edit Organization" to="/organization" />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider variant="inset" />
            </>
          )}
          {memberships.map(m => (
            <ListItem key={m.roleId}>
              <ListItemIcon>
                <Avatar email={m.account.email} fallback={m.name} size={28} />
              </ListItemIcon>
              <ListItemText
                primary={m.name}
                secondary={
                  <>
                    Owner <b>{m.account.email}</b>
                    &nbsp; - Joined <Duration startTime={m.created.getTime()} ago />
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Chip label={m.roleName} size="small" />
                <Box width={100} display="inline-block" textAlign="right" marginRight={`${spacing.md}px`}>
                  <LicenseChip license={m.license} />
                </Box>
                <IconButton
                  icon="sign-out"
                  title="Leave Account"
                  onClick={() => accounts.leaveMembership(m.account.id)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Body center>
          <Typography variant="h2" gutterBottom>
            No Organization Memberships
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Organizations can add you to their account to provide access to the devices they own.
          </Typography>
        </Body>
      )}
    </Container>
  )
}
