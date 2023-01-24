import React from 'react'
import { useLocation } from 'react-router-dom'
import { getFreeLicenses } from '../models/plans'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { selectOrganization } from '../selectors/organizations'
import { Typography, Button, Box } from '@mui/material'
import { ContactSelector } from '../components/ContactSelector'
import { RoleSelect } from '../components/RoleSelect'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { useHistory } from 'react-router-dom'

export const OrganizationAddPage = () => {
  const { contacts, organization, freeLicenses } = useSelector((state: ApplicationState) => {
    const organization = selectOrganization(state)
    return {
      organization,
      contacts: state.contacts.all.filter(c => !organization.members.find(s => s.user.id === c.id)) || [],
      freeLicenses: getFreeLicenses(state),
    }
  })

  const [emails, setEmails] = React.useState<string[]>([])
  const [roleId, setRoleId] = React.useState<IOrganizationRoleIdType>(
    organization.roles.find(r => r.name === 'Member')?.id || ''
  )
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()
  const license = freeLicenses ? 'LICENSED' : 'UNLICENSED'

  const exit = () => history.push(location.pathname.replace('/share', ''))
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
            <Title>Add Organization Members</Title>
          </Typography>
          <Gutters top={null}>
            <ContactSelector contacts={contacts} selected={emails} onSelect={setEmails} />
          </Gutters>
        </>
      }
    >
      <Typography variant="subtitle1">Role Assignment</Typography>
      <Gutters>
        <Box display="flex">
          <Box marginRight={2} minWidth={150}>
            <RoleSelect
              size="medium"
              roleId={roleId}
              roles={organization.roles}
              onSelect={id => setRoleId(id)}
              fullWidth
            />
          </Box>
          {!freeLicenses && (
            <Notice severity="warning" fullWidth>
              Purchase additional licenses to grant this user full access.
              <br />
            </Notice>
          )}
        </Box>
      </Gutters>
      <Gutters top="xl">
        <Button onClick={add} variant="contained" color="primary" disabled={!emails.length}>
          Add
        </Button>
        <Button onClick={exit}>Cancel</Button>
      </Gutters>
    </Container>
  )
}
