import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getFreeLicenses } from '../models/licensing'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { Typography, Button, Box } from '@material-ui/core'
import { ContactSelector } from '../components/ContactSelector'
import { RoleSelect } from '../components/RoleSelect'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { useHistory } from 'react-router-dom'
import analyticsHelper from '../helpers/analyticsHelper'

export const OrganizationAddPage = () => {
  const { contacts, organization, freeLicenses } = useSelector((state: ApplicationState) => ({
    contacts: state.contacts.all.filter(c => !state.organization.members.find(s => s.user.id === c.id)) || [],
    organization: state.organization,
    freeLicenses: getFreeLicenses(state),
  }))

  const [emails, setEmails] = React.useState<string[]>([])
  const [roleId, setRoleId] = React.useState<IOrganizationRoleIdType>('MEMBER')
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const history = useHistory()
  const disabled = !freeLicenses
  const license = freeLicenses ? 'LICENSED' : 'UNLICENSED'

  useEffect(() => {
    analyticsHelper.page('AccountLinkPage')
  }, [])

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
            <ContactSelector contacts={contacts} onChange={setEmails} />
          </Gutters>
        </>
      }
    >
      <Typography variant="subtitle1">Role Assignment</Typography>
      <Gutters>
        <Box display="flex" alignItems="center">
          <RoleSelect
            size="medium"
            roleId={roleId}
            roles={organization.roles}
            license={license}
            onSelect={id => setRoleId(id)}
          />
          {disabled && (
            <Notice severity="warning">
              Purchase additional licenses to set a role. <br />
            </Notice>
          )}
        </Box>
        {!!emails.length && (
          <Notice gutterTop fullWidth>
            Granting access to all the devices and services you own. <br />
            <em>Scripting will also be allowed when available.</em>
          </Notice>
        )}
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
