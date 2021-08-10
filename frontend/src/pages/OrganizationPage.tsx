import React, { useEffect } from 'react'
import { Dispatch, ApplicationState } from '../store'
import {
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Duration } from '../components/Duration'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Link } from 'react-router-dom'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import { ROLE } from '../models/organization'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationPage: React.FC = () => {
  const organization = useSelector((state: ApplicationState) => state.organization)
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    analyticsHelper.page('OrganizationPage')
  }, [])

  return (
    <Container
      header={
        <>
          <Typography variant="h1">
            <Title>Organization</Title>
            <IconButton title="Add member" icon="user-plus" to={'/settings/organization/share'} size="md" />
          </Typography>
          <List>
            <InlineTextFieldSetting
              hideIcon
              value={organization.name}
              label="Name"
              resetValue={organization.name}
              onSave={name => dispatch.organization.setOrganization(name.toString())}
            />
            <Gutters>
              <Typography variant="body2" color="textSecondary">
                Add members to your organization to pay for accounts and share your device list.
              </Typography>
            </Gutters>
          </List>
        </>
      }
    >
      {!organization.initialized ? (
        <LoadingMessage />
      ) : organization.member.length ? (
        <List>
          {/* <ListItem>
            <Notice>These users have access to all the organization devices.</Notice>
          </ListItem> */}
          {organization.member.map(member => (
            <ListItem key={member.user.email}>
              <ListItemIcon>
                <Icon name="user" />
              </ListItemIcon>
              <ListItemText
                primary={member.user.email}
                secondary={
                  <>
                    Added <Duration startDate={member?.created} ago />
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Chip label={ROLE[member.role]} size="small" />
                <IconButton
                  title="Remove Account"
                  icon="times"
                  disabled={member.role === 'OWNER'}
                  onClick={() => {
                    dispatch.organization.removeMember(member)
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Body center>
          <Typography variant="body2" gutterBottom>
            Your organization <strong>{organization.name}</strong> has no members.
          </Typography>
          <Button variant="contained" color="primary" component={Link} to="/settings/organization/share">
            Add member
          </Button>
        </Body>
      )}
    </Container>
  )
}
