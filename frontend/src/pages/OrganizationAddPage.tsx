import React from 'react'
import { Dispatch, State } from '../store'
import { ENTERPRISE_PLAN_ID } from '../models/plans'
import { selectAvailableUsers } from '../selectors/organizations'
import { useLocation, useHistory, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Typography, Button, Box } from '@mui/material'
import { selectOrganization } from '../selectors/organizations'
import { ContactSelector } from '../components/ContactSelector'
import { RoleSelect } from '../components/RoleSelect'
import { Container } from '../components/Container'
import { ColorChip } from '../components/ColorChip'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

export const OrganizationAddPage = () => {
  const organization = useSelector(selectOrganization)
  const allContacts = useSelector((state: State) => state.contacts.all)
  const freeUsers = useSelector(selectAvailableUsers)
  const enterprise = organization.licenses.find(l => l.plan.id === ENTERPRISE_PLAN_ID)
  const contacts = allContacts.filter(c => !organization.members.find(s => s.user.id === c.id)) || []

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
          {!freeUsers && !enterprise && (
            <Notice
              severity="warning"
              button={
                <Link to="/account/plans">
                  <ColorChip sx={{ marginTop: 1.4 }} size="small" variant="contained" color="warning" label="Upgrade" />
                </Link>
              }
              fullWidth
            >
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
