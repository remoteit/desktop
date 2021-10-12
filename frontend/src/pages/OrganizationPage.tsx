import React, { useEffect } from 'react'
import { Dispatch, ApplicationState } from '../store'
import {
  Typography,
  Divider,
  Button,
  List,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { OrganizationMember } from '../components/OrganizationMember'
import { LoadingMessage } from '../components/LoadingMessage'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { Link } from 'react-router-dom'
import { Body } from '../components/Body'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationPage: React.FC = () => {
  const organization = useSelector((state: ApplicationState) => state.organization)
  const [removing, setRemoving] = React.useState<string>()
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    setRemoving(undefined)
  }, [organization])

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
            <OrganizationMember
              key={member.user.id}
              member={member}
              removing={removing === member.user.id}
              onClick={() => setRemoving(member.user.id)}
            />
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
      <Divider variant="inset" />
    </Container>
  )
}
