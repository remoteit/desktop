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
import { Container } from '../components/Container'
import { Duration } from '../components/Duration'
import { Gutters } from '../components/Gutters'
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
        <Typography variant="h1">
          <Title>Device List Sharing</Title>
          <AddUserButton to={'/settings/access/share'} />
        </Typography>
      }
    >
      <Gutters bottom={null}>
        <Typography variant="body2">Share all the devices you own to another user</Typography>
      </Gutters>
      {access.length ? (
        <List>
          <ListItem>
            <Notice>These users have access to all the devices you own.</Notice>
          </ListItem>
          {access.map(user => (
            <ListItem key={user.email}>
              <ListItemIcon>
                <InitiatorPlatform id={user.platform} user />
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
                    <Icon name="times" size="md" fixedWidth />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Body center>
          <Typography variant="h2" gutterBottom>
            Your device list is not shared with anyone
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Share your device list to users to provide them with access to the devices you own.
          </Typography>
        </Body>
      )}
    </Container>
  )
}
