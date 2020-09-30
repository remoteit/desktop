import React, { useEffect } from 'react'
import { Dispatch, ApplicationState } from '../store'
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
import { AddUserButton } from '../buttons/AddUserButton'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Container } from '../components/Container'
import { Duration } from '../components/Duration'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import analyticsHelper from '../helpers/analyticsHelper'

export const AccountAccessPage: React.FC = () => {
  const { access } = useSelector((state: ApplicationState) => state.accounts)
  const { accounts } = useDispatch<Dispatch>()

  useEffect(() => {
    analyticsHelper.page('AccountAccessPage')
  }, [])

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="people-arrows" size="lg" />
            <Title>Account Linked Users</Title>
            <AddUserButton />
          </Typography>
        </>
      }
    >
      {access.length ? (
        <List>
          <ListItem>
            <Notice>These users have access to all the devices you own.</Notice>
          </ListItem>
          {access.map(user => (
            <ListItem key={user.email}>
              <ListItemIcon>
                <InitiatorPlatform id={user.platform} />
              </ListItemIcon>
              <ListItemText
                primary={user.email}
                secondary={
                  <>
                    Linked <Duration startTime={user.created?.getTime()} ago />
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="Remove Account">
                  <IconButton onClick={() => accounts.removeAccess(user.email)}>
                    <Icon name="times-circle" size="md" fixedWidth />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Body center>
          <Typography variant="h2" gutterBottom>
            No Linked Users
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Linked users can access all the devices you own.
          </Typography>
        </Body>
      )}
    </Container>
  )
}
