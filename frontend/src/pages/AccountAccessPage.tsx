import React, { useEffect } from 'react'
import { Dispatch, ApplicationState } from '../store'
import { Breadcrumbs } from '../components/Breadcrumbs'
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
import { InitiatorPlatform } from '../components/InitiatorPlatform'
import { useSelector, useDispatch } from 'react-redux'
import { Container } from '../components/Container'
import { AddUserButton } from '../buttons/AddUserButton'
import { Duration } from '../components/Duration'
import { Title } from '../components/Title'
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
            <Icon name="users" size="lg" />
            <Title>Account Linked Users</Title>
            <AddUserButton />
          </Typography>
        </>
      }
    >
      <List>
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
    </Container>
  )
}
