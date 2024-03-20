import React from 'react'
import { useLocation } from 'react-router-dom'
import { getAvailableUsers } from '../models/plans'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { selectOrganization } from '../selectors/organizations'
import { Typography, Button } from '@mui/material'
import { ContactSelector } from '../components/ContactSelector'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { useHistory } from 'react-router-dom'

export const CustomerAddPage = () => {
  const { contacts, organization, freeUsers } = useSelector((state: State) => {
    const organization = selectOrganization(state)
    return {
      organization,
      contacts: state.contacts.all.filter(c => !organization.members.find(s => s.user.id === c.id)) || [],
      freeUsers: getAvailableUsers(state),
    }
  })

  const [emails, setEmails] = React.useState<string[]>([])
  const [roleId, setRoleId] = React.useState<IOrganizationRoleIdType>(
    organization.roles.find(r => r.name === 'Member')?.id || ''
  )
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()
  const license = freeUsers ? 'LICENSED' : 'UNLICENSED'

  const exit = () => history.push(location.pathname.replace('/add', ''))
  const add = () => {
    dispatch.organization.setMembers(
      emails.map(email => ({
        roleId,
        license,
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
        <Button onClick={add} variant="contained" color="primary" disabled={!emails.length}>
          Add
        </Button>
        <Button onClick={exit}>Cancel</Button>
      </Gutters>
    </Container>
  )
}
