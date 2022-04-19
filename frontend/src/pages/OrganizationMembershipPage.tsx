import React, { useEffect } from 'react'
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
} from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { getRemoteitLicense } from '../models/licensing'
import { LicenseChip } from '../components/LicenseChip'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Duration } from '../components/Duration'
import { spacing } from '../styling'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationMembershipPage: React.FC = () => {
  const { membership, organization, license, email } = useSelector((state: ApplicationState) => ({
    membership: state.accounts.membership,
    organization: state.organization,
    license: getRemoteitLicense(state),
    email: state.auth.user?.email || '',
  }))
  const { accounts } = useDispatch<Dispatch>()

  useEffect(() => {
    analyticsHelper.page('AccountAccessPage')
  }, [])
  console.log('LICENSE', organization)
  return (
    <Container
      header={
        <Typography variant="h1">
          <Title>Organization Memberships</Title>
        </Typography>
      }
    >
      {membership.length ? (
        <List>
          {organization && (
            <>
              <ListItem key={organization.id}>
                <ListItemIcon>
                  <Avatar email={email} size={25} />
                </ListItemIcon>
                <ListItemText primary={organization.name} secondary="Your organization" />
                <ListItemSecondaryAction>
                  <Chip label={organization.roles.find(r => r.id === 'OWNER')?.name} size="small" />
                  <Box width={100} display="inline-block" textAlign="right" marginRight={`${spacing.md}px`}>
                    <LicenseChip license={license?.valid ? 'LICENSED' : 'UNLICENSED'} />
                  </Box>
                  <IconButton icon="pencil" title="Edit Organization" to="/account/organization" />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider variant="inset" />
            </>
          )}
          {membership.map(m => (
            <ListItem key={m.organization.id}>
              <ListItemIcon>
                <Icon name="industry-alt" />
              </ListItemIcon>
              <ListItemText
                primary={m.organization.name}
                secondary={
                  <>
                    Owner <b>{m.organization.account?.email}</b>
                    &nbsp; - Joined <Duration startTime={m.created?.getTime()} ago />
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Chip label={m.organization.roles.find(r => r.id === m.roleId)?.name} size="small" />
                <Box width={100} display="inline-block" textAlign="right" marginRight={`${spacing.md}px`}>
                  <LicenseChip license={m.license} />
                </Box>
                <IconButton
                  icon="sign-out"
                  title="Leave Account"
                  onClick={() => accounts.leaveMembership(m.organization.id)}
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
