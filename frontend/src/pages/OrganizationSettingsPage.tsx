import React from 'react'
import { Redirect } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { Typography, List } from '@mui/material'
import { selectPermissions, selectOrganization } from '../selectors/organizations'
import { OrganizationSAMLSettings } from '../components/OrganizationSAMLSettings'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { DeleteButton } from '../buttons/DeleteButton'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

export const OrganizationSettingsPage: React.FC = () => {
  const organization = useSelector(selectOrganization)
  const permissions = useSelector(selectPermissions)
  const isOrgOwner = useSelector((state: State) => organization.id === state.user.id)
  const dispatch = useDispatch<Dispatch>()

  if (!permissions?.includes('ADMIN'))
    return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container
      bodyProps={{ inset: false }}
      header={
        <Typography variant="h1">
          <Title>Settings</Title>
          {isOrgOwner && (
            <DeleteButton
              title="Delete Organization"
              warning={
                <>
                  <Notice severity="error" fullWidth gutterBottom>
                    You will be permanently deleting <i>{organization.name}. </i>
                  </Notice>
                  This will remove all your members and their access to your devices.
                </>
              }
              onDelete={async () => await dispatch.organization.removeOrganization()}
            />
          )}
        </Typography>
      }
    >
      {organization.reseller && (
        <>
          <Typography variant="subtitle1">Reseller</Typography>
          <List>
            <InlineTextFieldSetting
              icon="user"
              value={organization.contact.name}
              label="Name"
              resetValue={organization.contact.name}
              onSave={value => alert(`Save contact ${value}`)}
            />
            <InlineTextFieldSetting
              icon="at"
              value={organization.contact.email}
              label="Email"
              resetValue={organization.contact.email}
              onSave={value => alert(`Save contact ${value}`)}
            />
            <InlineTextFieldSetting
              icon="phone"
              value={organization.contact.phone}
              label="Phone"
              resetValue={organization.contact.phone}
              onSave={value => alert(`Save contact ${value}`)}
            />
          </List>
        </>
      )}
      <Typography variant="subtitle1">General</Typography>
      <List>
        <InlineTextFieldSetting
          icon="industry-alt"
          value={organization.name}
          label="Organization Name"
          resetValue={organization.name}
          onSave={name => dispatch.organization.setOrganization({ name: name.toString() })}
        />
      </List>
      <OrganizationSAMLSettings />
    </Container>
  )
}
