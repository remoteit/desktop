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
  const { user, access, contacts = [] } = useSelector((state: ApplicationState) => ({
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
            <Title inline>Add Users</Title>
          </Typography>
        </>
      }
    >
      <ContactSelector contacts={contacts.filter(c => !access.find(s => s.email === c.email))} onChange={setEmails} />
      {!!emails.length && (
        <Notice gutterBottom>
          Granting access to all the devices and services you ({user?.email}) own. <br />
          <em>Scripting will also be allowed when available in desktop.</em>
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
