import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
  const {
    member,
    contacts = [],
    organization,
  } = useSelector((state: ApplicationState) => ({
    member: state.organization.member,
    contacts: state.devices.contacts,
    organization: state.organization,
  }))

  const [emails, setEmails] = React.useState<string[]>([])
  const [role, setRole] = React.useState<IOrganizationRole>('MEMBER')
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    analyticsHelper.page('AccountLinkPage')
  }, [])

  const exit = () => history.push(location.pathname.replace('/share', ''))
  const add = () => {
    dispatch.organization.setMembers(
      emails.map(email => ({
        role,
        created: new Date(),
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
          <ContactSelector
            contacts={contacts.filter(c => !member.find(s => s.user.id === c.id))}
            onChange={setEmails}
          />
        </>
      }
    >
      {/* {!!emails.length && (
        <Notice gutterBottom>
          Granting access to all the devices and services you ({user?.email}) own. <br />
          <em>Scripting will also be allowed when available in desktop.</em>
        </Notice>
      )} */}
      <Typography variant="subtitle1">Role ({role})</Typography>
      <List>
        <ListItemRadio label="Admin" checked={role === 'ADMIN'} onClick={() => setRole('ADMIN')} />
        <ListItemRadio label="Member" checked={role === 'MEMBER'} onClick={() => setRole('MEMBER')} />
        <ListItemRadio label="Guest" checked={role === 'GUEST'} onClick={() => setRole('GUEST')} />
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
