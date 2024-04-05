import React from 'react'
import { useLocation } from 'react-router-dom'
import { selectOrganization } from '../selectors/organizations'
import { Dispatch, State } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { Typography, Button } from '@mui/material'
import { ContactSelector } from '../components/ContactSelector'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { useHistory } from 'react-router-dom'

export const CustomerAddPage = () => {
  const [emails, setEmails] = React.useState<string[]>([])
  const [adding, setAdding] = React.useState<boolean>(false)
  const organization = useSelector(selectOrganization)
  const all = useSelector((state: State) => state.contacts.all)
  const contacts = all.filter(a => !organization?.reseller?.customers.find(c => c.id === a.id)) || []

  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()

  const exit = () => history.push(location.pathname.replace('/add', ''))
  const add = async () => {
    setAdding(true)
    await dispatch.organization.addCustomer({ emails, id: organization.id })
    exit()
    setAdding(false)
  }

  return (
    <Container
      bodyProps={{ inset: false }}
      header={
        <>
          <Typography variant="h1">
            <Title>Add Customers</Title>
          </Typography>
          <Gutters top={null}>
            <ContactSelector contacts={contacts} selected={emails} onSelect={setEmails} />
          </Gutters>
        </>
      }
    >
      <Gutters top="xl">
        <Typography variant="body2" gutterBottom>
          Add a user to your reseller account.
        </Typography>
        <Notice fullWidth gutterBottom>
          New customers will be added to your reseller account and given a free plan.
          <em>You can upgrade them to a paid plan afterwards.</em>
        </Notice>
        <Button onClick={add} variant="contained" color="primary" disabled={!emails.length || adding}>
          {adding ? 'Adding...' : 'Add'}
        </Button>
        <Button onClick={exit}>Cancel</Button>
      </Gutters>
    </Container>
  )
}
