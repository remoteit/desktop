import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Typography, Button } from '@material-ui/core'
import { ContactSelector } from '../components/ContactSelector'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { useHistory } from 'react-router-dom'
import analyticsHelper from '../helpers/analyticsHelper'

export const AccountSharePage = () => {
  const { accounts } = useDispatch<Dispatch>()
  const { count, user, access, contacts = [] } = useSelector((state: ApplicationState) => ({
    count: state.devices.all.reduce((count, d) => count + (d.shared || d.hidden ? 0 : 1), 0),
    user: state.auth.user,
    access: state.accounts.access,
    contacts: state.devices.contacts,
  }))

  const [emails, setEmails] = React.useState<string[]>([])
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    analyticsHelper.page('AccountLinkPage')
  }, [])

  const exit = () => history.push(location.pathname.replace('/share', ''))

  return (
    <Container
      inset
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="user-plus" size="lg" />
            <Title>Add Users</Title>
          </Typography>
        </>
      }
    >
      <ContactSelector contacts={contacts.filter(c => !access.find(s => s.email === c.email))} onChange={setEmails} />
      {!!emails.length && (
        <Notice>
          Granting access to all <b>{count} devices</b> owned by you <i>({user?.email})</i>.
        </Notice>
      )}
      <Button
        onClick={() => accounts.addAccess(emails) && exit()}
        variant="contained"
        color="primary"
        disabled={!emails.length}
      >
        Add
        <Icon name="check" type="regular" inline fixedWidth />
      </Button>
      <Button onClick={exit}>Cancel</Button>
    </Container>
  )
}
