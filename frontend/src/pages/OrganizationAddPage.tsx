import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getFreeLicenses } from '../models/licensing'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Typography, Button, List } from '@material-ui/core'
import { ContactSelector } from '../components/ContactSelector'
import { ListItemRadio } from '../components/ListItemRadio'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { useHistory } from 'react-router-dom'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationAddPage = () => {
  const { contacts, organization, freeLicenses } = useSelector((state: ApplicationState) => ({
    contacts: state.contacts.all.filter(c => !state.organization.members.find(s => s.user.id === c.id)) || [],
    organization: state.organization,
    freeLicenses: getFreeLicenses(state),
  }))

  const [emails, setEmails] = React.useState<string[]>([])
  const [role, setRole] = React.useState<IOrganizationRoleType>('MEMBER')
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()
  const disabled = !freeLicenses

  useEffect(() => {
    analyticsHelper.page('AccountLinkPage')
  }, [])

  const exit = () => history.push(location.pathname.replace('/share', ''))
  const add = () => {
    dispatch.organization.setMembers(
      emails.map(email => ({
        role,
        created: new Date(),
        license: freeLicenses ? 'LICENSED' : 'UNLICENSED',
        organizationId: organization.id || '',
        user: { email, id: '' },
      }))
    )
    exit()
  }

  return (
    <Container
      bodyProps={{ inset: false }}
      header={
        <>
          <Typography variant="h1">
            <Title>Add Organization Members</Title>
          </Typography>
          <Gutters top={null}>
            <ContactSelector contacts={contacts} onChange={setEmails} />
          </Gutters>
        </>
      }
    >
      {!!emails.length && (
        <Gutters size="md">
          <Notice gutterBottom>
            Granting access to all the devices and services you own. <br />
            <em>Scripting will also be allowed when available.</em>
          </Notice>
        </Gutters>
      )}
      <Typography variant="subtitle1">Role</Typography>
      <List disablePadding>
        <ListItemRadio
          label="Admin"
          subLabel={
            <>
              Can connect and manage all devices.
              {disabled && (
                <Typography variant="caption" color="error">
                  &nbsp; License required.
                </Typography>
              )}
            </>
          }
          disabled={disabled}
          checked={role === 'ADMIN'}
          onClick={() => setRole('ADMIN')}
        />
        <ListItemRadio
          label="Member"
          subLabel="Can connect to all devices."
          checked={role === 'MEMBER'}
          onClick={() => setRole('MEMBER')}
        />
      </List>
      <Gutters>
        <Button onClick={add} variant="contained" color="primary" disabled={!emails.length}>
          Add
          <Icon name="check" type="regular" inline fixedWidth />
        </Button>
        <Button onClick={exit}>Cancel</Button>
      </Gutters>
    </Container>
  )
}
