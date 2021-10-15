import React, { useEffect } from 'react'
import { ApplicationState, Dispatch } from '../store'
import {
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  IconButton,
} from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ROLE } from '../models/organization'
import { Container } from '../components/Container'
import { Duration } from '../components/Duration'
import { Title } from '../components/Title'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationMembershipPage: React.FC = () => {
  const { membership } = useSelector((state: ApplicationState) => state.accounts)
  const { accounts } = useDispatch<Dispatch>()

  useEffect(() => {
    analyticsHelper.page('AccountAccessPage')
  }, [])

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
                <Chip label={ROLE[m.role]} size="small" />
                <Tooltip title="Leave Account">
                  <IconButton onClick={() => accounts.leaveMembership(m.organization.id)}>
                    <Icon name="sign-out" size="md" fixedWidth />
                  </IconButton>
                </Tooltip>
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
