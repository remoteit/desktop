import React, { useEffect } from 'react'
import { ApplicationState, Dispatch } from '../store'
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  IconButton,
} from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { InitiatorPlatform } from '../components/InitiatorPlatform'
import { Container } from '../components/Container'
import { Duration } from '../components/Duration'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import analyticsHelper from '../helpers/analyticsHelper'

export const AccountMembershipPage: React.FC = () => {
  const { member } = useSelector((state: ApplicationState) => state.accounts)
  const { accounts } = useDispatch<Dispatch>()

  useEffect(() => {
    analyticsHelper.page('AccountAccessPage')
  }, [])

  return (
    <Container
      header={
        <Typography variant="h1">
          <Title>Manage Device Lists</Title>
        </Typography>
      }
    >
      {member.length ? (
        <List>
          <ListItem>
            <Notice>You have access to these device lists.</Notice>
          </ListItem>
          {member.map(user => (
            <ListItem key={user.email}>
              <ListItemIcon>
                <InitiatorPlatform id={user.platform} user />
              </ListItemIcon>
              <ListItemText
                primary={user.email}
                secondary={
                  <>
                    Joined <Duration startTime={user.created?.getTime()} ago />
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="Leave Account">
                  <IconButton onClick={() => accounts.leaveMembership(user.email)}>
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
            No Account Memberships
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Others users can link you to their account to provide access to the devices they own.
          </Typography>
        </Body>
      )}
    </Container>
  )
}
